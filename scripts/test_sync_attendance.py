"""Regression check: mirror styles and remove retired UI without touching stored data."""
from pathlib import Path
import json, shutil, subprocess, sys, tempfile, unittest

class AttendancePublishTest(unittest.TestCase):
    def test_ui_mirror_preserves_non_ui_files(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            (root / 'scripts').mkdir()
            shutil.copyfile(Path(__file__).with_name('sync-attendance.py'), root / 'scripts/sync-attendance.py')
            source = root / 'source'
            target = root / 'attendance'
            for base in [source, target]:
                for folder in ['js', 'css', 'assets', 'styles']:
                    (base / folder).mkdir(parents=True)
            (source / 'index.html').write_text('<html>new</html>')
            (source / 'styles/student-workspace.css').write_text('new-ui{}')
            (source / 'styles/ui-manifest.json').write_text('{"version":"new"}')
            (source / 'js/shell.js').write_text('new-shell')
            (target / 'css/theme.css').write_text('old-theme')
            (target / 'styles/attendance-base.css').write_text('old-bundle')
            (target / 'js/retired.js').write_text('old-code')
            (target / 'records.json').write_text('important records')
            (target / 'assets/logo.png').write_bytes(b'keep-image')
            subprocess.run([sys.executable, str(root / 'scripts/sync-attendance.py'), str(source), 'revision-new'], check=True, capture_output=True)
            self.assertEqual((target / 'styles/student-workspace.css').read_text(), 'new-ui{}')
            self.assertFalse((target / 'css/theme.css').exists())
            self.assertFalse((target / 'styles/attendance-base.css').exists())
            self.assertFalse((target / 'js/retired.js').exists())
            self.assertEqual((target / 'records.json').read_text(), 'important records')
            self.assertEqual((target / 'assets/logo.png').read_bytes(), b'keep-image')
            self.assertEqual(json.loads((target / 'source.json').read_text())['commit'], 'revision-new')

if __name__ == '__main__':
    unittest.main()
