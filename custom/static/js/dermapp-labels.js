/**
 * Created by stonerri on 7/28/14.
 */

var _labels = [
    { name: 'background', color: [255, 255, 255]},
    { name: 'foreground', color: [255, 255, 255]},
    { name : '10', color: [251, 17, 13], icon: "static/derm/images/5-lines.jpg", title: 'Lines' },
    { name : '20', color: [251, 18, 13], icon: "static/derm/images/5-lines_reticular.jpg", title: 'Reticular' },
    { name : '21', color: [251, 19, 13], icon: "static/derm/images/5-lines_reticular_regular.jpg", title: 'Regular' },
    { name : '22', color: [251, 20, 13], icon: "static/derm/images/5-lines_reticular_thick.jpg", title: 'Thick' },
    { name : '23', color: [251, 21, 13], icon: "static/derm/images/5-lines_reticular_thin.jpg", title: 'Thin' },
    { name : '24', color: [251, 22, 13], icon: "static/derm/images/5-lines_reticular_atypical.jpg", title: 'Atypical' },
    { name : '25', color: [251, 23, 13], icon: "static/derm/images/5-lines_reticular_negativenetwork.jpg", title: 'Negative Network' },
    { name : '30', color: [251, 24, 13], icon: "static/derm/images/5-lines_radial.jpg", title: 'Radial' },
    { name : '31', color: [251, 25, 13], icon: "static/derm/images/5-lines_radial_radiallinesconnectedtoacommonbase.jpg", title: 'Radial lines connected to a common base' },
    { name : '32', color: [251, 26, 13], icon: "static/derm/images/5-lines_radial_radiallinesconvergingtoacentraldot.jpg", title: 'Radial lines converging to a central dot' },
    { name : '33', color: [251, 27, 13], icon: "static/derm/images/5-lines_radial_radiallines-peripheral.jpg", title: 'Radial lines, peripheral' },
    { name : '40', color: [251, 28, 13], icon: "static/derm/images/5-lines_branched.jpg", title: 'Branched' },
    { name : '50', color: [251, 29, 13], icon: "static/derm/images/5-lines_parallelandstraight.jpg", title: 'Parallel and straight' },
    { name : '51', color: [251, 30, 13], icon: "static/derm/images/5-lines_parallelandstraight_furrows.jpg", title: 'Furrows' },
    { name : '52', color: [251, 31, 13], icon: "static/derm/images/5-lines_parallelandstraight_ridges.jpg", title: 'Ridges' },
    { name : '53', color: [251, 32, 13], icon: "static/derm/images/5-lines_parallelandstraight_fibrallar.jpg", title: 'Fibrallar' },
    { name : '60', color: [251, 33, 13], icon: "static/derm/images/5-lines_curved.jpg", title: 'Curved' },
    { name : '61', color: [251, 34, 13], icon: "static/derm/images/5-lines_curved_thick.jpg", title: 'Thick' },
    { name : '62', color: [251, 35, 13], icon: "static/derm/images/5-lines_curved_thin.jpg", title: 'Thin' },
    { name : '41', color: [251, 36, 13], icon: "static/derm/images/5-lines_zigzag.jpg", title: 'Zig Zag' },
    { name : '70', color: [236, 252, 37], icon: "static/derm/images/5-dots-clods.jpg", title: 'Dots & Clods' },
    { name : '71', color: [236, 252, 38], icon: "static/derm/images/5-dots-clods_dots.jpg", title: 'Dots' },
    { name : '72', color: [236, 252, 39], icon: "static/derm/images/5-dots-clods_dots_atypicaldots.jpg", title: 'Atypical Dots' },
    { name : '73', color: [236, 252, 40], icon: "static/derm/images/5-dots-clods_dots_dots-foursquare.jpg", title: 'Dots, Four square' },
    { name : '74', color: [236, 252, 41], icon: "static/derm/images/5-dots-clods_dots_dots-circle.jpg", title: 'Dots, Circle' },
    { name : '75', color: [236, 252, 42], icon: "static/derm/images/5-dots-clods_dots_dots-lines.jpg", title: 'Dots, Lines' },
    { name : '76', color: [236, 252, 43], icon: "static/derm/images/5-dots-clods_clods.jpg", title: 'Clods' },
    { name : '77', color: [236, 252, 44], icon: "static/derm/images/5-dots-clods_clods_atypicalclods.jpg", title: 'Atypical Clods' },
    { name : '80', color: [126, 45, 169], icon: "static/derm/images/5-structureless.jpg", title: 'Structureless' },
    { name : '81', color: [126, 46, 169], icon: "static/derm/images/5-structureless_blue-whiteveil.jpg", title: 'Blue-White Veil' },
    { name : '82', color: [126, 47, 169], icon: "static/derm/images/5-structureless_pseudonetwork.jpg", title: 'Pseudonetwork' },
    { name : '83', color: [126, 48, 169], icon: "static/derm/images/5-structureless_peripheralbrownstructurelessarea.jpg", title: 'Peripheral brown structureless area' },
    { name : '84', color: [126, 49, 169], icon: "static/derm/images/5-structureless_off-centeredblotch.jpg", title: 'Off-centered blotch' },
    { name : '100', color: [20, 209, 50], icon: "static/derm/images/5-vessels.jpg", title: 'Vessels' },
    { name : '110', color: [20, 209, 51], icon: "static/derm/images/5-vessels_lines.jpg", title: 'Lines' },
    { name : '111', color: [20, 209, 52], icon: "static/derm/images/5-vessels_lines_straight.jpg", title: 'Straight' },
    { name : '112', color: [20, 209, 53], icon: "static/derm/images/5-vessels_lines_looped.jpg", title: 'Looped' },
    { name : '113', color: [20, 209, 54], icon: "static/derm/images/5-vessels_lines_looped_loopedwithwhitehalo.jpg", title: 'Looped with white Halo' },
    { name : '114', color: [20, 209, 55], icon: "static/derm/images/5-vessels_lines_curved.jpg", title: 'Curved' },
    { name : '115', color: [20, 209, 56], icon: "static/derm/images/5-vessels_lines_serpentine.jpg", title: 'Serpentine' },
    { name : '116', color: [20, 209, 57], icon: "static/derm/images/5-vessels_lines_helical.jpg", title: 'Helical' },
    { name : '117', color: [20, 209, 58], icon: "static/derm/images/5-vessels_lines_coiled.jpg", title: 'Coiled' },
    { name : '118', color: [20, 209, 59], icon: "static/derm/images/5-vessels_lines_branched.jpg", title: 'Branched' },
    { name : '101', color: [20, 209, 60], icon: "static/derm/images/5-vessels_dots.jpg", title: 'Dots' },
    { name : '102', color: [20, 209, 61], icon: "static/derm/images/5-vessels_clods.jpg", title: 'Clods' },
    { name : '120', color: [20, 209, 62], icon: "static/derm/images/5-vessels_milky-redarea.jpg", title: 'Milky-red area' },
    { name : '130', color: [20, 209, 63], icon: "static/derm/images/5-vessels_polymorphousvessels.jpg", title: 'Polymorphous vessels' },
    { name : '140', color: [64, 140, 255], icon: "static/derm/images/5-other.jpg", title: 'Other' },
    { name : '150', color: [65, 140, 255], icon: "static/derm/images/5-other_shinywhitelines.jpg", title: 'Shiny white lines' },
    { name : '151', color: [66, 140, 255], icon: "static/derm/images/5-other_circles.jpg", title: 'Circles' },
    { name : '152', color: [67, 140, 255], icon: "static/derm/images/5-other_pseudopods.jpg", title: 'Pseudopods' },
    { name : '153', color: [68, 140, 255], icon: "static/derm/images/5-other_sharplydemarcatedscallopedborder.jpg", title: 'Sharply demarcated scalloped border' }
];




