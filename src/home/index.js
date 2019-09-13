import { render, h, Component } from 'preact';
import style from './style.scss';
import styleTabs from '../scss/tabs.scss';

import SignIn from './signIn'
import SignUp from './signUp'
import CreateGame from './createGame'

export default class Home extends Component {

	constructor(props) {
	    super(props);
	    this.state.tab = "signin"
	}

	componentDidMount() {

		// watch for user
		window.firebaseApp.auth().onAuthStateChanged(function(user) {
			this.setState({
				user: user,
				tab: (user ? 'creategame' : 'signin')
			});
		}.bind(this));

	}

	setTab = function(event) {
		let tab = event.target.getAttribute('data-tab');
		this.setState({
			tab: tab
		});
	}.bind(this);

	logout = function(event) {
		if (this.state.user) {
			window.firebaseApp.auth().signOut();
		}
	}.bind(this);

	render() {

		let tabs = [];
		let tabContent = null;

		if (this.state.user) {
			tabs.push(<li class={"tab"+(this.state.tab === "creategame" ? ' active' : '')} onClick={this.setTab} data-tab='creategame'>Create Game</li>);
			tabs.push(<li class="tab" onClick={this.logout} data-tab='signin'>Log-out</li>);
			tabContent = <CreateGame user={this.state.user} />;
		} else {
			tabs.push(<li class={"tab"+(this.state.tab === "signin" ? ' active' : '')} onClick={this.setTab} data-tab='signin'>Log-in</li>);
			tabs.push(<li class={"tab"+(this.state.tab === "signup" ? ' active' : '')} onClick={this.setTab} data-tab='signup'>Join</li>);
			if (this.state.tab === "signin") {
				tabContent = <SignIn />;
			} else {
				tabContent = <SignUp />;
			}
		}

		return (
			<div class={style.home}>
				<h1>Nuisance Value</h1>

				<p>{this.state.user ? 'Welcome ' + this.state.user.displayName : ''}</p>
				<div class={style.tabset}>
					<ul class="tabs">
						{tabs}
					</ul>
					<div class={style.content}>
						{tabContent}
					</div>
				</div>

			</div>
		);
	}
}
