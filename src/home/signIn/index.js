import { h, Component } from 'preact';
import style from './style.scss';
import styleButtons from '../../scss/buttons.scss';

import FormField from '../formField';

export default class SignIn extends Component {

	constructor(props) {
	    super(props);
	}

	emailChanged = function(email) {
		this.setState({email: email});
	}.bind(this)

	passwordChanged = function(password) {
		this.setState({password: password});
	}.bind(this)

	signin = function(event) {


		window.firebaseApp.auth().signInWithEmailAndPassword(this.state.email, this.state.password).catch(function(error) {
		  console.error(error.code + ": " + error.message)
		  alert(error.message);
		});
	}.bind(this)

	render() {

	   return (
			<div class={style.signIn}>
				<h2>Existing User Log-in</h2>
				<FormField name="email" label="Email" onChange={this.emailChanged} />
	        	<FormField type="password" name="password" label="Password" onChange={this.passwordChanged} />
	        	<button onClick={this.signin}>Log-in</button>
			</div>
		);
	}
}

