from pathlib import Path
import urllib.request, urllib.error
env={}
for line in Path('.env').read_text().splitlines():
s=line.strip()
if s and not s.startswith('#') and '=' in s:
k,v=s.split('=',1)
env[k.strip()]=v.strip()

key=env.get('HIGGSFIELD_API_KEY')
base=env.get('HIGGSFIELD_BASE_URL','https://platform.higgsfield.ai').rstrip('/')
url=base + '/v1/text2image/soul-styles'

print("key_set:", bool(key))
req=urllib.request.Request(url, headers={'Authorization': f'Bearer {key}', 'Accept':'application/json'})
try:
with urllib.request.urlopen(req, timeout=20) as r:

print("OK HTTP", r.status)
print(r.read(200).decode('utf-8','ignore'))
except urllib.error.HTTPError as e:
print("HTTP", e.code)
print(e.read(200).decode('utf-8','ignore'))
except Exception as e:
print("ERR", type(e).__name__, str(e))
