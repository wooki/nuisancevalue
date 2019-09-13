import { render, h, Component } from 'preact';
import Home from './home'
import styleColors from './scss/colors.scss';
import styleFonts from './scss/fonts.scss';

document.addEventListener('DOMContentLoaded', function() {

	try {
		window.firebaseApp = firebase.app();
		window.firebaseFeatures = ['auth', 'database'].filter(feature => typeof window.firebaseApp[feature] === 'function');

	  	render(<Home />, document.body);

	} catch (e) {
		console.error(e);
	}
});