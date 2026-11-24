import sys; sys.path.insert(0,'/tmp/L'); from rend import *
import time
for k in [5]+list(range(6,23)):
    t=time.time(); a,col=alpha_of({k},f'f{k}')
    np.save(f'/tmp/L/a{k}.npy',(a*255).astype(np.uint8)); print(k,int((a>0.5).sum()),round(time.time()-t,1),flush=True)
