from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("hse", "0003_actionform_affected_documents"),
    ]

    operations = [
        migrations.AddField(
            model_name="toolboxmeeting",
            name="location_text",
            field=models.CharField(blank=True, max_length=120),
        ),
        migrations.AddField(
            model_name="toolboxmeeting",
            name="notes_text",
            field=models.CharField(blank=True, max_length=1000),
        ),
        migrations.AlterField(
            model_name="tbmattendee",
            name="role_text",
            field=models.CharField(blank=True, max_length=255),
        ),
    ]
