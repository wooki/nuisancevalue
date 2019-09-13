import { h, Component } from 'preact';
import style from './style.scss';
import styleButtons from '../../scss/buttons.scss';

import FormField from '../formField';

export default class Home extends Component {

	constructor(props) {
	    super(props);
	}

	emailChanged = function(email) {
		this.setState({email: email});
	}.bind(this)

	nameChanged = function(name) {
		this.setState({name: name});
	}.bind(this)

	passwordChanged = function(password) {
		this.setState({password: password});
	}.bind(this)

	signup = function(event) {

		window.firebaseApp.auth().onAuthStateChanged(function(user) {
			if (user) {
				user.updateProfile({
				  displayName: this.state.name
				});
			}
		}.bind(this));

		window.firebaseApp.auth().createUserWithEmailAndPassword(this.state.email, this.state.password).catch(function(error) {
		  console.error(error.code + ": " + error.message)
		  alert(error.message);
		});

	}.bind(this)

	render() {

	   return (
			<div class={style.signUp}>
				<h2>New User Sign-up</h2>
				<FormField name="email" label="Email" onChange={this.emailChanged} />
	        	<FormField name="name" label="displayName" onChange={this.nameChanged} />
	        	<FormField type="password" name="password" label="Password" onChange={this.passwordChanged} />
	        	<button onClick={this.signup}>Join</button>
			</div>
		);
	}
}

