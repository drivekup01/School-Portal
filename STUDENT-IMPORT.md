# Student account import (SGS Excel)

Admin Center → บัญชีนักเรียน → นำเข้าวันเกิดและรหัสเข้าใช้นักเรียน.

1. Choose academic year, semester and an `.xlsx` file (up to 6 MB / 2,000 students).
2. Choose whether to update birthdates only (default), or also set birthday passwords and enable matched accounts.
3. Preview and inspect the comparison against the existing attendance roster.
4. Confirm to apply eligible rows. Mismatches are skipped; no students are deleted or created.

The importer recognizes the school's SGS layout, including a report title above the header and duplicate `เลขประจำตัวนักเรียน` headers. It selects the unique column containing at most five digits per student, pads numeric school IDs to five digits, and rejects ambiguous columns. Thirteen-digit national IDs, addresses, health details, and family information are neither sent to the backend nor saved. The original workbook stays in the browser and is not uploaded.

Only code, name, class, birthdate and source row number are submitted. Matching requires a unique active student code, matching name (allowing common title/spacing variants), matching room, academic year, and semester. Missing codes, duplicate codes, and conflicting account bindings require correction in the source roster first.

Birthday passwords use **DDMM Buddhist year**, e.g. the fictional date 5 January 2010 is `05012553`. Dates are stored as Gregorian ISO dates in private `school_student_passwords` documents. Passwords use independent scrypt salts/hashes. Importing birthdates alone does not change passwords, enable accounts, or expire sessions. Explicit password import enables accounts and increments session versions. Subsequent admin enable/reset uses the saved birthday; absent a birthday, the legacy `123456` temporary password remains supported. Login still requires the school student code, not national ID.

`schoolStudentImport` is an admin-only callable. Both preview and each apply transaction require a verified active Google administrator. Private preview jobs expire after one hour and can only be applied by their creator, in sequential batches of 15. A retry resumes the committed cursor without resetting completed accounts again. Roster, account version, active status and administrator rights are rechecked in transactions. Completion removes the job's detailed rows, keeping counts/metadata; server audit records contain no birthday/password payload. A partly applied job reports the committed count; preview again if the roster changed.

These collections remain inaccessible through client Firestore rules. Birthdates, credentials and import jobs belong to the **encrypted accounts backup**, not the plain roster export. No original workbook or real student data belongs in this repository.

Verification: backend import/password/authorization tests plus browser-module UI tests and a read-only parse of the supplied SGS workbook. Production credential changes occur only after an administrator confirms import in the UI.
