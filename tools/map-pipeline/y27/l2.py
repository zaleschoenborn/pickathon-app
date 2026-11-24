import sys; sys.path.insert(0,'/tmp/L'); from rend import *
import time
for k in list(range(23,49)):
    t=time.time(); a,col=alpha_of({k},f'p{k}')
    np.save(f'/tmp/L/pa{k}.npy',(a*255).astype(np.uint8)); np.save(f'/tmp/L/pc{k}.npy',col.astype(np.uint8))
    print(k,int((a>0.05).sum()),round(time.time()-t,1),flush=True)
