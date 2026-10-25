"""Publish only the static attendance UI; School-Attendance remains canonical."""
from pathlib import Path
import shutil,subprocess,json,sys
root=Path(__file__).resolve().parent.parent
source=Path(sys.argv[1]).resolve()
target=(root/'attendance').resolve()
assert target.parent==root and source!=target
files=list(source.glob('*.html'))
for folder in ['js','css','assets']:
 files.extend(p for p in (source/folder).rglob('*') if p.is_file() and p.suffix.lower() in {'.js','.css','.png','.svg','.ico','.txt'})
for src in files:
 relative=src.relative_to(source)
 dest=target/relative
 dest.parent.mkdir(parents=True,exist_ok=True)
 shutil.copyfile(src,dest)
revision=sys.argv[2] if len(sys.argv)>2 else subprocess.check_output(['git','-C',str(source),'rev-parse','HEAD'],text=True).strip()
(target/'source.json').write_text(json.dumps({'repository':'drivekup01/School-Attendance','commit':revision},indent=2)+'\n',encoding='utf8')
print(f'Published {len(files)} static UI files from School-Attendance {revision}')
