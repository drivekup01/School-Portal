"""Export platform icon sizes from the existing school logo, without redrawing it."""
from pathlib import Path
from PIL import Image
from io import BytesIO
import re,base64
root=Path(__file__).resolve().parent.parent
encoded=re.search(r'data:image/png;base64,([^"\s]+)',(root/'school-logo.svg').read_text(encoding='utf8')).group(1)
original=Image.open(BytesIO(base64.b64decode(encoded))).convert('RGBA')
target=root/'icons';target.mkdir(exist_ok=True)
for filename,size,ratio,background in [('app-192.png',192,.90,'#faf8fd'),('app-512.png',512,.90,'#faf8fd'),('app-maskable-512.png',512,.72,'#663394'),('apple-touch-180.png',180,.90,'#faf8fd')]:
 canvas=Image.new('RGBA',(size,size),background)
 logo=original.copy();logo.thumbnail((round(size*ratio),round(size*ratio)),Image.Resampling.LANCZOS)
 canvas.alpha_composite(logo,((size-logo.width)//2,(size-logo.height)//2))
 canvas.convert('RGB').save(target/filename,optimize=True)
 print(filename,size)
