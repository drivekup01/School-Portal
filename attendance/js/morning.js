import {boot} from './shell.js?v=20261027-morning2';
import {attendancePage} from './attendance.js?v=20261027-morning2';
boot('morning',ctx=>attendancePage(ctx,'morning'));
