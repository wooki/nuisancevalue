import { h, Component } from 'preact';
import style from './style.scss';
import styleButtons from '../../scss/buttons.scss';

import FormField from '../formField';

export default class CreateGame extends Component {

	constructor(props) {
	    super(props);
	}

	nameChanged = function(name) {
		this.setState({name: name});
	}.bind(this)

	create = function(event) {

		// create an empty shell of a mission and provide URLs for
		// the server (must be run by you) - self-hosted JS should be able to hook into this
		// game is responsible for creating player ships so player URLs will be done there
		let game = {
			name: this.state.name || "[Unnamed Game]]",
			host: this.props.user.displayName,
	    	hostId: this.props.user.uid,
	    	state: 'initialise'
		}
		let gameRef = window.firebaseApp.database().ref('games');
	    gameRef.push(game).then((dataSnapshot) => {
	    	let key = dataSnapshot.key;
	    	window.location = "/server/"+key;
	    });

	}.bind(this)

	render() {

	   return (
			<div class={style.signIn}>
				<h2>Create Game</h2>
				<FormField name="name" label="Game Name" onChange={this.nameChanged} />
	        	<button onClick={this.create}>Create</button>
			</div>
		);
	}
}

