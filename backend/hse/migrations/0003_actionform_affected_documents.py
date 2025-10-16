from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("hse", "0002_alter_actionform_indicator_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="actionform",
            name="affected_documents",
            field=models.JSONField(blank=True, default=list),
        ),
    ]
