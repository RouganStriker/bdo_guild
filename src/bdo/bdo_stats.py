from collections import OrderedDict

import numpy as np
import pandas as pd
import requests


class BDOStats(object):
    def __init__(self):
        self.column_data = OrderedDict([
            ('Fortress', {
                'stats': [('max', 'Most')],
                'verb': ' Destroyed',
                'emoji': ':european_castle:',
            }),
            ('Command Post', {
                'stats': [('max', 'Most')],
                'verb': ' Destroyed',
                'emoji': ':japanese_castle:',
            }),
            ('Gate', {
                'stats': [('max', 'Most')],
                'verb': ' Destroyed',
                'emoji': ':shinto_shrine:',
            }),
            ('Help', {
                'stats': [('max', 'Most'), ('min', 'Least'), ('sum', 'Guild Total')],
                'verb': '',
                'emoji': ':handshake:',
            }),
            ('Mount', {
                'stats': [('max', 'Most'), ('min', 'Least'), ('sum', 'Guild Total')],
                'verb': ' Kills',
                'emoji': ':horse:',
            }),
            ('Placed Object', {
                'stats': [('max', 'Most')],
                'verb': ' Destroyed',
                'emoji': ':hammer:',
            }),
            ('Guild Master', {
                'stats': [('max', 'Most'), ('min', 'Least')],
                'verb': ' Kills',
                'emoji': ':prince:',
            }),
            ('Officer', {
                'stats': [('max', 'Most'), ('min', 'Least')],
                'verb': ' Kills',
                'emoji': ':cop:',
            }),
            ('Member', {
                'stats': [('max', 'Most'), ('min', 'Least')],
                'verb': ' Kills',
                'emoji': ':man_with_gua_pi_mao:',
            }),
            ('Deaths', {
                'stats': [('max', 'Most'), ('min', 'Least'), ('mean', 'Average'), ('sum', 'Guild Total')],
                'verb': '',
                'emoji': ':skull_crossbones:',
            }),
            ('Siege Weapons', {
                'stats': [('max', 'Most'), ('min', 'Least')],
                'verb': ' Kills',
                'emoji': ':bomb:',
            }),
            ('All Kills', {
                'stats': [('max', 'Most'), ('min', 'Least'), ('mean', 'Average'), ('sum', 'Guild Total')],
                'verb': ' Kills',
                'emoji': ':knife:',
            }),
            ('KDR', {
                'stats': [('max', 'Highest'), ('min', 'Lowest'), ('mean', 'Average')],
                'verb': '',
                'emoji': ':crossed_swords:',
            }),
        ])

        self.outcome_mapping = {
            0: ':trophy: Victory :trophy:',
            1: ':broken_heart: Defeat :broken_heart: ',
            2: ':shrug: Stalemate :shrug:',
        }

        self.achievements = [
            {
                'title': 'Look Ma I Helped!',
                'description': 'Get a help, kill and death',
                'formula': lambda df: (df['Help'] > 0) & (df['All Kills'] > 0) & (df['Deaths'] > 0),
            },
            {
                'title': 'Big Game Hunter',
                'description': 'Kill 20 Guild Masters',
                'formula': lambda df: df['Guild Master'] >= 20,
            },
            {
                'title': 'I Didn\'t Choose The Support Life',
                'description': 'Get 20 Help',
                'formula': lambda df: df['Help'] >= 20,
            },
            {
                'title': 'Glass Cannon',
                'description': 'Get 50 kills, 50 deaths',
                'formula': lambda df: (df['All Kills'] >= 50) & (df['Deaths'] >= 50),
            },
            {
                'title': 'Who Are You Fighting?',
                'description': 'Get more Mount kills than Player kills',
                'formula': lambda df: df['Mount'] > df['All Kills'],
            },
            {
                'title': 'I Like Big Guns',
                'description': 'Get 20 Siege Weapon kills',
                'formula': lambda df: df['Siege Weapons'] >= 20,
            },
            {
                'title': 'Wet Sponge :sweat_drops:',
                'description': 'Get 20+ Deaths without a Kill',
                'formula': lambda df: (df['Deaths'] >= 20) & (df['All Kills'] == 0),
            },
            {
                'title': 'Wrecking Ball',
                'description': 'Destroy a Fort and 5 Placed Objects',
                'formula': lambda df: ((df['Fortress'] >= 1) | (df['Command Post'] >= 1)) &
                                      (df['Placed Object'] >= 5),
            },
            {
                'title': 'Gate Crasher',
                'description': 'Destroy a Gate',
                'formula': lambda df: df['Gate'] >= 1,
            },
            {
                'title': 'Boogeyman :ghost:',
                'description': 'Destroy a Fort and Placed Object, Kill a Mount, Guild Master, Officer, Member, '
                               'and Kill with Siege Weapons',
                'formula': lambda df: ((df['Fortress'] >= 1) | (df['Command Post'] >= 1)) &
                                      (df['Placed Object'] >= 1) &
                                      (df['Mount'] >= 1) &
                                      (df['Guild Master'] >= 1) &
                                      (df['Officer'] >= 1) &
                                      (df['Member'] >= 1) &
                                      (df['Siege Weapons'] >= 1)
            },
            {
                'title': 'Double Double',
                'description': 'Get 10 Help, 10 Kills',
                'formula': lambda df: (df['Help'] >= 10) & (df['All Kills'] >= 10),
            },
            {
                'title': ':fire: Super Hot :fire:',
                'description': 'Get 100 Kills',
                'formula': lambda df: df['All Kills'] >= 100,
            },
            {
                'title': 'I\'m Having A Bad Day',
                'description': 'Get 100 Deaths',
                'formula': lambda df: df['Deaths'] >= 100,
            },
        ]


    @staticmethod
    def _find_players(df, condition):
        # Return a string of all players that satisfy the condition
        return ", ".join(sorted(df.iloc[np.where(condition)[0]].index.tolist()))

    def post_stats(self, webhook, stats, war):
        df = pd.DataFrame(stats, columns=['Player'] + list(self.column_data.keys())[:11])
        df['All Kills'] = df['Guild Master'] + df['Officer'] + df['Member'] + df['Siege Weapons']
        df['KDR'] = df['All Kills'].divide(df['Deaths'])
        df['KDR'].replace([np.inf, -np.inf], np.nan, inplace=True)
        df.round(2)
        df.set_index('Player', inplace=True)

        results = {
            'stats': [],
            'achievements': []
        }

        # Get min, max and average for stats
        for col, data in self.column_data.items():
            field_values = []

            for stat, adjective in data['stats']:
                if stat == 'max':
                    value = df[col].max()
                elif stat == 'min':
                    value = df[col].min()
                elif stat == 'mean':
                    value = round(df[col].mean(), 2)
                elif stat == 'sum':
                    value = df[col].sum()
                else:
                    raise Exception("Unknown stat {0}".format(stat))

                if value == 0 or stat in ['mean', 'sum']:
                    players = ''
                else:
                    # List the player names
                    players = " ({})".format(self._find_players(df, df[col] == value))

                verb = data['verb'] if stat != 'sum' else ''
                field_values.append(
                    '{adjective}{verb}: {value}{players}'.format(adjective=adjective,
                                                                 verb=verb,
                                                                 value=value,
                                                                 players=players)
                )

            results['stats'].append({
                'name': '{emoji} {col}'.format(emoji=data['emoji'],
                                               col=col,
                                               verb=data['verb']),
                'value': '\n'.join(field_values),
            })

        # Get achievements
        for achievement in self.achievements:
            # See if any player got it
            players = self._find_players(df, achievement['formula'](df))

            if not players:
                continue

            results['achievements'].append({
                "name": "{title} ({got}/{total})".format(title=achievement['title'],
                                                         got=len(players.split(',')),
                                                         total=len(stats)),
                "value": "*{description}*\n{players}".format(description=achievement['description'],
                                                             players=players),
            })

        display_date = war.get_display_date()
        if war.node:
            node_name = war.node.name
        else:
            node_name = 'Unknown'
        outcome = war.outcome

        data = {
            "content": "@everyone",
            "embeds": [
                {
                    "title": ":information_source: Node War Summary",
                    "color": "6591981",
                    "fields": [
                        {
                            "name": "Date",
                            "value": display_date
                        },
                        {
                            "name": "Attendance Count",
                            "value": len(stats),
                        },
                        {
                            "name": "Node Name",
                            "value": node_name,
                        },
                        {
                            "name": "Outcome",
                            "value": self.outcome_mapping[outcome],
                        },
                    ]
                },
                {
                    "title": ":bar_chart: Stats",
                    "fields": results['stats'],
                    "color": "3978097",
                },
                {
                    "title": ":military_medal: Achievements",
                    "fields": results['achievements'],
                    "color": "9662683",
                }
            ]
        }

        requests.post(webhook, json=data)
