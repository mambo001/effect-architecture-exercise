gcloud config configurations create emulator
gcloud config set disable_prompts true
gcloud config set auth/disable_credentials true
gcloud config set project your-project-id
gcloud config set api_endpoint_overrides/spanner http://spanner-emulator:9020/
gcloud config configurations activate emulator

gcloud spanner instances create $SPANNER_INSTANCE \
    --config=emulator-config \
    --nodes=1 \
    --description=none \
    --project=$GOOGLE_CLOUD_PROJECT

gcloud spanner databases create $SPANNER_DATABASE \
    --instance=$SPANNER_INSTANCE \
    --project=$GOOGLE_CLOUD_PROJECT

gcloud spanner databases ddl update $SPANNER_DATABASE \
    --ddl="CREATE TABLE Todo ( id STRING(128) NOT NULL, timestamp TIMESTAMP, title STRING(1024), isDone BOOL" \
    --instance=$SPANNER_INSTANCE \
    --project=$GOOGLE_CLOUD_PROJECT

gcloud spanner databases ddl update $SPANNER_DATABASE \
    --ddl="CREATE TABLE Users ( id STRING(128) NOT NULL, name STRING(1024), assignedTodos ARRAY<STRING(128)> " \
    --instance=$SPANNER_INSTANCE \
    --project=$GOOGLE_CLOUD_PROJECT
