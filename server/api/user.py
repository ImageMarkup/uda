#!/usr/bin/env python
# -*- coding: utf-8 -*-

###############################################################################
#  Copyright Kitware Inc.
#
#  Licensed under the Apache License, Version 2.0 ( the "License" );
#  you may not use this file except in compliance with the License.
#  You may obtain a copy of the License at
#
#    http://www.apache.org/licenses/LICENSE-2.0
#
#  Unless required by applicable law or agreed to in writing, software
#  distributed under the License is distributed on an "AS IS" BASIS,
#  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#  See the License for the specific language governing permissions and
#  limitations under the License.
###############################################################################

from girder import events
from girder.api import access
from girder.api.describe import Description, describeRoute
from girder.api.rest import RestException, boundHandler
from girder.constants import AccessType, TokenScope
from girder.models.model_base import ValidationException
from girder.utility import mail_utils
from girder.utility.model_importer import ModelImporter

from .base import IsicResource


def attachUserPermissions(userResponse):
    User = ModelImporter.model('user', 'isic_archive')

    user = User.load(userResponse['_id'], exc=True, force=True)

    userResponse['permissions'] = {
        'acceptTerms': User.canAcceptTerms(user),
        'createDataset': User.canCreateDataset(user),
        'reviewDataset': User.canReviewDataset(user),
        'segmentationSkill': User.getSegmentationSkill(user),
        'adminStudy': User.canAdminStudy(user)
    }


def onGetUserAuthentication(event):
    userResponse = event.info['returnVal']['user']
    attachUserPermissions(userResponse)


def onGetUserMe(event):
    userResponse = event.info['returnVal']
    # It is possible for userResponse to be None, for anonymous users
    if userResponse:
        attachUserPermissions(userResponse)


def onPostUser(event):
    userResponse = event.info['returnVal']
    attachUserPermissions(userResponse)


def getUserEmail(user):
    User = ModelImporter.model('user', 'isic_archive')
    user = User.load(user['id'], force=True, exc=True)
    return user['email']


_sharedContext = IsicResource()


@access.user
@describeRoute(
    Description('Request permission to create datasets.'))
@boundHandler(_sharedContext)
def requestCreateDatasetPermission(self, params):
    User = self.model('user', 'isic_archive')
    Group = self.model('group')
    currentUser = self.getCurrentUser()
    resp = {}
    if User.canCreateDataset(currentUser):
        resp['message'] = 'Dataset Contributor access granted.',
        resp['extra'] = 'hasPermission'
    else:
        # Request that user join group
        groupName = 'Dataset Contributors'
        group = Group.findOne({'name': groupName})
        if not group:
            raise RestException('Could not load group: %s' % groupName)
        resp['message'] = 'Dataset Contributor access requested. An administrator may contact ' \
                          'you via email (at %s) to process your request.' % currentUser['email']

        for request in Group.getFullRequestList(group):
            if request['id'] == currentUser['_id']:
                # Request for this user is already pending
                break
        else:
            # No request for this user yet
            Group.joinGroup(group, currentUser)

            # Send email to group moderators and administrators
            groupAcl = Group.getFullAccessList(group)
            groupModeratorEmails = [
                getUserEmail(user)
                for user in groupAcl['users']
                if user['level'] >= AccessType.WRITE
            ]
            host = mail_utils.getEmailUrlPrefix()
            html = mail_utils.renderTemplate(
                'datasetContributorRequest.mako',
                {
                    'user': currentUser,
                    'group': group,
                    'host': host,
                })
            mail_utils.sendEmail(
                to=groupModeratorEmails,
                subject='ISIC Archive: Dataset Contributor Request',
                text=html)

    return resp


@access.user
@describeRoute(
    Description('Accept Terms of Use.'))
@boundHandler(_sharedContext)
def acceptTerms(self, params):
    User = self.model('user', 'isic_archive')

    currentUser = self.getCurrentUser()
    if not User.canAcceptTerms(currentUser):
        User.acceptTerms(currentUser)
        User.save(currentUser)

    resp = {
        'message': 'Terms of Use accepted.',
        'extra': 'hasPermission'
    }
    return resp


@access.user
@describeRoute(
    Description('Pre-create a new user and issue them an invite.')
    .param('login', 'The user\'s requested login.')
    .param('email', 'The user\'s email address.')
    .param('firstName', 'The user\'s first name.')
    .param('lastName', 'The user\'s last name.')
    .param('validityPeriod', 'The number of days that the invite will remain valid.',
           required=False, dataType='float', default=30.0)
)
@boundHandler(_sharedContext)
def inviteUser(self, params):
    Token = self.model('token')
    User = self.model('user', 'isic_archive')

    params = self._decodeParams(params)
    self.requireParams(['login', 'email', 'firstName', 'lastName'], params)
    if 'validityPeriod' in params:
        try:
            validityPeriod = params['validityPeriod']
        except ValueError:
            raise ValidationException('Validity period must be a number.', 'validityPeriod')
    else:
        validityPeriod = 30.0

    currentUser = self.getCurrentUser()
    User.requireAdminStudy(currentUser)

    newUser = User.createUser(
        login=params['login'],
        password=None,
        email=params['email'],
        firstName=params['firstName'],
        lastName=params['lastName']
        # TODO: suppress sending emails, in case email verification setting is enabled, as
        # email verification will also be done when the temporary password is exchanged
    )

    # TODO: disable user

    token = Token.createToken(
        newUser, days=validityPeriod,
        scope=[TokenScope.TEMPORARY_USER_AUTH, TokenScope.EMAIL_VERIFICATION])

    inviteUrl = '%s/#user/%s/rsvp/%s' % (
        mail_utils.getEmailUrlPrefix(), newUser['_id'], token['_id'])

    html = mail_utils.renderTemplate(
        'inviteUser.mako',
        {
            'newUser': newUser,
            'inviteUrl': inviteUrl,
        })
    mail_utils.sendEmail(
        to=newUser['email'],
        subject='ISIC Archive: Invitation',
        text=html)

    return {
        'newUser': User.filteredSummary(newUser, currentUser),
        'inviteUrl': inviteUrl
    }


def attachUserApi(user):
    events.bind('rest.get.user/authentication.after', 'onGetUserAuthentication',
                onGetUserAuthentication)
    events.bind('rest.get.user/me.after', 'onGetUserMe', onGetUserMe)
    events.bind('rest.post.user.after', 'onPostUser', onPostUser)
    user.route('POST', ('requestCreateDatasetPermission',), requestCreateDatasetPermission)
    user.route('POST', ('acceptTerms',), acceptTerms)
    user.route('POST', ('invite',), inviteUser)
