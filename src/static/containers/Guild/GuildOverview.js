import React, {Component} from 'react';
import { Grid, Row, Col } from 'react-bootstrap';
import { connect } from 'react-redux';
import Paper from 'material-ui/Paper';
import {Card, CardActions, CardHeader, CardMedia, CardTitle, CardText} from 'material-ui/Card';
import Divider from 'material-ui/Divider';
import { Bar, Radar } from 'react-chartjs-2';

import LoadingWidget from '../../components/LoadingWidget';
import {
  GuildService,
} from '../../services';


class GuildOverview extends React.Component {
  constructor(props) {
    super(props);
  }

  componentWillMount() {
    const { dispatch, guild } = this.props;

    if (guild.selected && !guild.selected.stat_totals) {
      dispatch(GuildService.get({ id: guild.selected.id, params: { include: 'stats' } }))
    }
  }

  _construct_distribution_dataset() {
    const {
      mystic = 0,
      striker = 0,
      warrior = 0,
      valkyrie = 0,
      berserker = 0,
      ranger = 0,
      sorceress = 0,
      wizard = 0,
      witch = 0,
      tamer = 0,
      kunoichi = 0,
      ninja = 0,
      musa = 0,
      maehwa = 0,
    } = this.props.guild.selected.class_distribution;
    const darkKnight = this.props.guild.selected.class_distribution["dark knight"] || 0;

    return {
      labels: [
        "Mystic/Striker",
        "Warrior/Valkyrie",
        "Berserker",
        "Ranger",
        "Sorceress",
        "Wizard/Witch",
        "Tamer",
        "Dark Knight",
        "Kunoichi/Ninja",
        "Musa/Maehwa"
      ],
      datasets: [
        {
          label: "Affect",
          backgroundColor: "rgba(0, 188, 212,0.2)",
          borderColor: "rgba(0, 188, 212,1)",
          pointBackgroundColor: "rgba(0, 188, 212,0.2)",
          pointBorderColor: "rgba(0, 188, 212,1)",
          data: [
            mystic + striker,
            warrior + valkyrie,
            berserker,
            ranger,
            sorceress,
            wizard + witch,
            tamer,
            darkKnight,
            kunoichi + ninja,
            musa + maehwa,
          ]
        }
      ]
    };
  }

  renderClassDistribution() {
    const options = {
      maintainAspectRatio: false,
      title: {
        display: false
      },
      legend: {
        display: false
      },
      scale: {
        ticks: {
          display: false
        }
      }
    }

    return <Radar data={this._construct_distribution_dataset()} options={options} />
  }

  _construct_stat_dataset() {
    const { guild: { selected: { stat_totals } } } = this.props;
    const baseDataSet = {
      backgroundColor: 'rgba(0, 188, 212,0.4)',
      borderColor: 'rgba(0, 188, 212,1)',
      borderWidth: 1,
      stack: '1',
      hoverBackgroundColor: 'rgba(255, 64, 129,0.4)',
      hoverBorderColor: 'rgba(255, 64, 129,1)',
    }

    return {
      labels: ["Total Kills", "Total Deaths"],
      datasets: [
        {
          ...baseDataSet,
          label: 'Guild Master',
          data: [stat_totals.total_guild_master, 0]
        },
        {
          ...baseDataSet,
          label: 'Officer',
          hoverBackgroundColor: 'rgba(255, 127, 161, 0.4)',
          hoverBorderColor: 'rgba(255, 64, 129,1)',
          data: [stat_totals.total_officer, 0]
        },
        {
          ...baseDataSet,
          label: 'Member',
          hoverBackgroundColor: 'rgba(	255, 174, 193, 0.4)',
          hoverBorderColor: 'rgba(255, 64, 129,1)',
          data: [stat_totals.total_member, 0]
        },
        {
          ...baseDataSet,
          label: 'Siege Weapon',
          hoverBackgroundColor: 'rgba(255, 215, 224, 0.4)',
          hoverBorderColor: 'rgba(255, 64, 129,1)',
          data: [stat_totals.total_siege_weapons, 0]
        },
        {
          ...baseDataSet,
          label: 'Death',
          data: [0, stat_totals.total_death]
        }
      ]
    }
  }

  renderStatTotals() {
    const options = {
      title: {
        display: false
      },
      legend: {
        display: false
      },
      scales: {
        xAxes: [{
            stacked: true
        }],
        yAxes: [{
            stacked: true
        }]
      }
    }

    return <Bar data={this._construct_stat_dataset()} options={options} />
  }

  render() {
    const { guild: { selected } } = this.props;

    if (!selected || !selected.stat_totals) {
      return <LoadingWidget />
    }

    const {
      average_gearscore,
      average_level,
      description,
      guild_master,
      logo_url,
      members,
      member_count,
    } = selected;

    return (
      <Grid componentClass={Paper} style={{padding: 0}}>
        <Card>
          <CardText>
            <Row>
              <Col xs={6} md={4} style={{maxWidth: 160, maxHeight: 160}}>
                <img src={logo_url}
                     style={{width: 130}}/>
              </Col>
              <Col xs={6} md={4}>
                <div>
                  <label style={{width: 130}} className="bdo-field-label">Guild Master:</label>
                  <span>{ guild_master.family_name }</span>
                </div>
                <div>
                  <label style={{width: 130}} className="bdo-field-label">Member Count:</label>
                  <span>{ member_count }</span>
                </div>
                <div>
                  <label style={{width: 130}} className="bdo-field-label">Average Level:</label>
                  <span>{ average_level }</span>
                </div>
                <div>
                  <label style={{width: 130}} className="bdo-field-label">Average GS:</label>
                  <span>{ average_gearscore }</span>
                </div>
              </Col>
            </Row>
          </CardText>
          <CardText>
            <div>
              { description }
            </div>
          </CardText>
        </Card>
        <Card>
          <CardText>
            <Row>
              <Col md={6} style={{minHeight: 250, paddingTop: 15}}>
                { this.renderClassDistribution() }
              </Col>
              <Col md={6} style={{paddingTop: 15}}>
                { this.renderStatTotals() }
              </Col>
            </Row>
          </CardText>
        </Card>
      </Grid>
    )
  }
}

const mapStateToProps = (state) => {
  return {
      profile: state.profile,
      guild: state.guild,
  };
};

export default connect(mapStateToProps)(GuildOverview)
