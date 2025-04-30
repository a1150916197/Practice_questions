#!/bin/bash\nfallocate -l 2G /swapfile\nchmod 600 /swapfile\nmkswap /swapfile\nswapon /swapfile\necho '/swapfile swap swap defaults 0 0' >> /etc/fstab\necho 'Swap空间已创建并激活'
