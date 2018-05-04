import React from 'react';
import { Link } from 'react-router-dom'
import { connect } from 'react-redux';
import { Grid } from 'react-bootstrap';
import {Card, CardText} from 'material-ui/Card';
import Paper from 'material-ui/Paper';

import BaseView from '../../components/BaseView';


class PrivacyPolicyView extends React.Component {

  renderContent() {
    return (
      <Grid componentClass={Paper} style={{padding: 0}}>
        <Card style={{padding: 24}}>
          <CardText>
            {this.renderPrivacyStatement()}
          </CardText>
        </Card>
      </Grid>
    );
  }

  renderPrivacyStatement() {
    const paragraphStyle = {
      margin: "16px 0px 32px",
      lineHeight: "28px",
    }
    const listStyle = {
      paddingLeft: 40,
      listStyle: "disc",
    }

    return (
      <div>
        <p style={paragraphStyle}>This privacy policy has been compiled to better serve those who are concerned with how their 'Personally Identifiable Information' (PII) is being used online. PII, as described in US privacy law and information security, is information that can be used on its own or with other information to identify, contact, or locate a single person, or to identify an individual in context. Please read our privacy policy carefully to get a clear understanding of how we collect, use, protect or otherwise handle your Personally Identifiable Information in accordance with our website.</p>

        <h5><strong>What personal information do we collect from the people that use our app?</strong></h5>
        <p style={paragraphStyle}>We retrieve your email and Discord username from your Discord account and associate it with your BDO Guilds account.</p>

        <h5><strong>When do we collect information?</strong></h5>
        <p style={paragraphStyle}>We collect information from your Discord account upon successful authentication.</p>

        <h5><strong>How do we use your information?</strong></h5>
        <p style={paragraphStyle}>We use the information we collect from your Discord account when you use the application in the following ways:
          <ul style={listStyle}>
            <li>To validate your Discord account</li>
            <li>To contact you</li>
          </ul>
        </p>

        <h5><strong>How do we protect your information?</strong></h5>
        <p style={paragraphStyle}>We keep up-to-date with security patches and utilize best security practices in development to the best of our ability.</p>

        <p style={paragraphStyle}>Your personal information is contained behind secured networks and is only accessible by a limited number of persons who have special access rights to such systems, and are required to keep the information confidential. In addition, all traffic to the site is encrypted via Secure Socket Layer (SSL) technology.</p>

        <h5><strong>Do we use 'cookies'?</strong></h5>
        <p style={paragraphStyle}>
          Yes. Cookies are small files that a site or its service provider transfers to your computer's hard drive through your Web browser (if you allow) that enables the site's or service provider's systems to recognize your browser and capture and remember certain information. For instance, cookies can be used to store your preferences based on previous or current site activity. Cookies can also be compiled and aggregated to get data about site traffic and site interaction.

          <br /><br />

          We use cookies to:
          <ul style={listStyle}>
            <li>Provide session authentication</li>
            <li>Mitigate cross-site request forgery</li>
          </ul>

          <br />

          You can choose to have your computer warn you each time a cookie is being sent, or you can choose to turn off all cookies. You do this through your browser settings. Since browser is a little different, look at your browser's Help Menu to learn the correct way to modify your cookies.
        </p>

        <h5><strong>If users disable cookies in their browser:</strong></h5>
        <p style={paragraphStyle}>If you turn cookies off it may render the application unusable.</p>

        <h5><strong>Third-party disclosure</strong></h5>
        <p style={paragraphStyle}>We do not sell, trade, or otherwise transfer to outside parties your Personally Identifiable Information.</p>

        <h5><strong>Third-party links</strong></h5>
        <p style={paragraphStyle}>Discord is used for authentication purposes. We do not serve any advertisements on the application.</p>

        <h5><strong>California Online Privacy Protection Act</strong></h5>
        <p style={paragraphStyle}>
          CalOPPA is the first state law in the nation to require commercial websites and online services to post a privacy policy. The law's reach stretches well beyond California to require any person or company in the United States (and conceivably the world) that operates websites collecting Personally Identifiable Information from California consumers to post a conspicuous privacy policy on its website stating exactly the information being collected and those individuals or companies with whom it is being shared. - See more at:
          <a style={{paddingLeft: 5}} href="http://consumercal.org/california-online-privacy-protection-act-caloppa">
            http://consumercal.org/california-online-privacy-protection-act-caloppa
          </a>

          <br /><br />

          According to CalOPPA, we agree to the following:
          <ul style={listStyle}>
            <li>Users can visit our site anonymously.</li>
            <li>Once this privacy policy is created, we will add a link to it on our home page or as a minimum, on the first significant page after entering our website.</li>
            <li>Our Privacy Policy link includes the word 'Privacy' and can easily be found on the page specified above.</li>
            <li>
              You will be notified of any Privacy Policy changes:
              <ul style={{...listStyle, paddingLeft: 60}}>
                <li>On our Privacy Policy Page</li>
              </ul>
            </li>
            <li>
              Can change your personal information:
              <ul style={{...listStyle, paddingLeft: 60}}>
                <li>By contacting us</li>
              </ul>
            </li>
          </ul>
        </p>

        <h5><strong>How does our site handle Do Not Track signals?</strong></h5>
        <p style={paragraphStyle}>We honor Do Not Track signals and Do Not Track, plant cookies, or use advertising when a Do Not Track (DNT) browser mechanism is in place.</p>

        <h5><strong>Does our site allow third-party behavioral tracking?</strong></h5>
        <p style={paragraphStyle}>We do not allow third-party behavioral tracking.</p>

        <h5><strong>COPPA (Children Online Privacy Protection Act)</strong></h5>
        <p style={paragraphStyle}>
          When it comes to the collection of personal information from children under the age of 13 years old, the Children's Online Privacy Protection Act (COPPA) puts parents in control. The Federal Trade Commission, United States' consumer protection agency, enforces the COPPA Rule, which spells out what operators of websites and online services must do to protect children's privacy and safety online.

          <br /><br />

          We do not specifically market to children under the age of 13 years old.
        </p>

        <h5><strong>Contacting Us</strong></h5>
        <p style={paragraphStyle}>If there are any questions regarding this privacy policy, you may <Link to="/contact">contact us.</Link></p>

        <br />

        <p style={paragraphStyle}>Last Edited on 2018-05-03</p>
      </div>
    );
  }

  render() {
      return (
        <BaseView title={"Privacy Policy"}
                  renderContent={this.renderContent.bind(this)} />
      );
  }
}

const mapStateToProps = (state) => {
  return {};
};

export default connect(mapStateToProps)(PrivacyPolicyView);
