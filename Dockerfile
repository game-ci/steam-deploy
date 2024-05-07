FROM steamcmd/steamcmd:ubuntu-22
COPY steam_deploy.sh /root/steam_deploy.sh
ENTRYPOINT ["/root/steam_deploy.sh"]
