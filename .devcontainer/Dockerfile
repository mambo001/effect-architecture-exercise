FROM gcr.io/google.com/cloudsdktool/google-cloud-cli:latest as gcloud

FROM mcr.microsoft.com/devcontainers/base:jammy as devcontainer

COPY --from=gcloud /usr/bin/gcloud /gcloud/bin/gcloud
COPY --from=gcloud /usr/lib/google-cloud-sdk/lib /gcloud/lib

CMD ["sleep", "infinity"]
