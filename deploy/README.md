# Deploy Chocolate

1. Make sure you have `cd`-ed into this folder,
   because the `docker-compose` build path is relative.
2. Modify `Caddyfile` to match your own domain, 
   HTTPS must be enabled, or MITM attack may cause
   user password leak.
3. `docker-compose up -d` to get Chocolate running,
   RTMP service will be avaliable at `1935`.
