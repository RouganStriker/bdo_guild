#!/bin/bash
python manage.py dumpdata auth.Group bdo.CharacterClass bdo.WarArea bdo.WarNode bdo.GuildRole bdo.WarRole --natural-foreign -o fixtures/content.json