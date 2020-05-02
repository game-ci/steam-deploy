FROM cm2network/steamcmd

LABEL "com.github.actions.name"="Steam - Deploy"
LABEL "com.github.actions.description"="Deploy game builds to Steam using the SteamSDK."
LABEL "com.github.actions.icon"="package"
LABEL "com.github.actions.color"="gray-dark"

LABEL "repository"="https://github.com/webbertakken/steam-deploy"
LABEL "homepage"="https://github.com/webbertakken/steam-deploy"
LABEL "maintainer"="Webber Takken <webber@takken.io>"

ADD steps /steps
RUN chmod -R +x /steps
ADD entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]
