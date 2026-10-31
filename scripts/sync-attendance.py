from pathlib import Path
import shutil, subprocess, json, sys
root = Path(__file__).resolve().parent.parent
source = Path(sys.argv[1]).resolve()
target = (root / 'attendance').resolve()
assert target.parent == root and source != target
files = list(source.glob('*.html'))
allowed = {'.js', '.css', '.png', '.svg', '.ico', '.txt', '.ttf', '.woff', '.woff2'}
for folder in ['js', 'css', 'assets', 'styles']:
    files.extend(p for p in (source / folder).rglob('*') if p.is_file() and
                 (p.suffix.lower() in allowed or p.relative_to(source).as_posix() == 'styles/ui-manifest.json'))
# Mirror retired styles only. Preserve Portal helper modules, records, configuration and images.
expected = {src.relative_to(source) for src in files}
for folder in ['css', 'styles']:
    for stale in (target / folder).rglob('*'):
        if stale.is_file() and stale.suffix == '.css' and stale.relative_to(target) not in expected:
            assert stale.resolve().is_relative_to(target)
            stale.unlink()
for src in files:
    dest = target / src.relative_to(source)
    dest.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(src, dest)
revision = sys.argv[2] if len(sys.argv) > 2 else subprocess.check_output(['git', '-C', str(source), 'rev-parse', 'HEAD'], text=True).strip()
(target / 'source.json').write_text(json.dumps({'repository': 'drivekup01/School-Attendance', 'commit': revision}, indent=2) + '\n', encoding='utf8')
print(f'Published {len(files)} static UI files from School-Attendance {revision}')
