FROM steamcmd/steamcmd:latest
COPY steam_deploy.sh /root/steam_deploy.sh
ENTRYPOINT ["/root/steam_deploy.sh"]
