import {boot} from './shell.js?v=20261027-readiness1';
import {attendancePage} from './attendance.js?v=20261027-readiness1';
boot('subject',ctx=>attendancePage(ctx,'subject'));
