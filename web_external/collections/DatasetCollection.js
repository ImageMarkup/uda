import {getCurrentUser} from 'girder/auth';

import Collection from './Collection';
import DatasetModel from '../models/DatasetModel';

const DatasetCollection = Collection.extend({
    resourceName: 'dataset',
    model: DatasetModel
}, {
    canCreate: function () {
        let user = getCurrentUser();
        return user && user.canCreateDataset();
    }
});

export default DatasetCollection;
