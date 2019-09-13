import { h, Component } from 'preact';
import style from './style.scss';

export default class FormField extends Component {

	constructor(props) {
	    super(props);
	    this.state = {value: this.props.value};
	}

	handleChange = function(event) {
		this.setState({value: event.target.value});
		if (this.props.onChange) {
			this.props.onChange(event.target.value);
		}
	}.bind(this)

	render() {

		let error = null;
		if (this.props.error) {
			error = <div class="error">{this.props.error}</div>;
		}

		return <div class={style.formField}>
			<label for={this.props.name}>{this.props.label}</label>
	        <input type={this.props.type || 'text'} value={this.state.value} onChange={this.handleChange} />
	        {error}
		</div>;
	}
}

