# School department permissions

The account editor offers four staff groups plus the separate system administrator:

| Group | Budget | Academic | Student care |
| --- | --- | --- | --- |
| Teacher / personnel | Create documents; edit own documents | View class and teacher timetables, substitutions and announcements | Deduct individual scores; mark assigned lessons and own homeroom morning attendance |
| Academic | Same baseline | Manage academic data and upload/publish student reports | Same baseline |
| Budget | Manage documents and ledger entries; update fiscal allocations | Same baseline | Same baseline |
| Student care | Same baseline | Same baseline | Add/deduct individual and group scores; attendance remains assigned |
| Administrator | All management | All management | All management |

Stored role keys remain `teacher`, `timetable`, `budget`, `student_support`, `admin`.
School-OS manages account role assignment. Approved active verified Google accounts
are required; signing in alone does not grant a department role. Canonical roles
ignore stale legacy module flags. Historical executive role keys remain readable;
`deputy` no longer grants budget or academic editing. Existing profiles are not
rewritten automatically. The account editor uses the four current groups.

Functions enforce document ownership using immutable server creator IDs. This
covers budget forms, disbursements and procurement documents. Budget staff/admin
may edit other creators' documents and delete them. Ordinary personnel cannot
write budget registers or import a fiscal year. Document creation does not post
financial entries. Financial history and archived-year restrictions still apply.

Attendance writes retain current assigned-lesson and homeroom checks. Student care
is not an attendance administrator. Only care staff/admin may batch score changes
or directly add points. Positive and negative batch changes retain per-room,
idempotent operation receipts and transaction authorization checks.

The administrator is redirected from staff login to `/admin/` before the teacher
dashboard starts reading its data. Admin navigation embeds the same modules.

Validation: backend role/ownership and batch score tests; virtual DOM check that
admin redirect precedes teacher dashboard reads; 35 Firebase Rules API cases with
synthetic profiles, including cross-department and server-only collection denial.
No real student marks, reports, budgets, profiles or documents are changed by QA.
