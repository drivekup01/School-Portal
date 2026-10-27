import {boot} from './shell.js?v=20261027-periods1';
import {attendancePage} from './attendance.js?v=20261027-periods1';
boot('morning',ctx=>attendancePage(ctx,'morning'));
