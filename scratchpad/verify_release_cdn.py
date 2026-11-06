import concurrent.futures,hashlib,json,subprocess,urllib.request,urllib.parse
from pathlib import Path
tag='v1.0.63'
paths=['dist/修仙状态栏/index.html','dist/自定义开局/index.html','dist/正文美化/index.html','dist/创意工坊/index.js','dist/楼层iframe回收/index.js']
paths += [p.as_posix() for p in Path('src/修仙状态栏/maps').rglob('*') if p.is_file()]
def check(path):
 url='https://testingcf.jsdelivr.net/gh/Awene/tavern_helper_template-main@'+tag+'/'+urllib.parse.quote(path)
 expected=subprocess.check_output(['git','show',tag+':'+path])
 try:
  with urllib.request.urlopen(url,timeout=35) as response:
   data=response.read();status=response.status
  actual=hashlib.sha256(data).hexdigest();wanted=hashlib.sha256(expected).hexdigest()
  return dict(path=path,status=status,match=data==expected,sha256=actual,expected=wanted)
 except Exception as error:return dict(path=path,error=str(error),match=False)
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool: results=list(pool.map(check,paths))
Path('scratchpad/release-cdn.json').write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf-8')
for r in results: print(json.dumps(r,ensure_ascii=True))
raise SystemExit(0 if all(r['match'] for r in results) else 1)
