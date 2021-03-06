import React from 'react';
import {
	LeftNav,
	MenuItem,
	ListItem,
	Divider,
	Avatar
} from 'material-ui';

import {
	AvQueueMusic,
	ActionSearch,
	ActionSettings,
	ActionPowerSettingsNew,
	ActionHistory,
	HardwareSecurity,
	ActionGetApp
} from 'material-ui/lib/svg-icons';

import { connect } from 'react-redux';
import { navigateTo } from 'actions/navigation';
import { logout } from 'actions/session';
import { firebaseForRoomId } from 'helpers/firebase';

import { fromJS } from 'immutable';

class NavItem extends React.Component {
	render() {
		return <MenuItem type="" {...this.props} />
	}
}

class NowPlayingItem extends React.Component {
	render() {
		let track = this.props.track;

		if(track === undefined) {
			return <div />
		}


		let images = track.get("images");

		return (
			<div>
				<ListItem type="" disabled primaryText="" secondaryText="SPILLER NÅ" style={{ textAlign: "center"}} />
				<ListItem
					type=""
					disabled
					primaryText={track.get("name")}
					secondaryText={track.get("artist")}
					leftAvatar={<Avatar src={track.getIn(["images", "medium"])} />}
				/>
			 </div>
		);
	}
}

class Nav extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			nowPlaying: undefined
		};
	}

	componentDidMount() {
		this.ref = firebaseForRoomId(this.props.roomId)
			.child("nowPlaying");

		this.onNowPlayingChanged = this.ref
			.on("value", (snap) => {
				if(snap.exists()) {
					this.setState({
						nowPlaying: fromJS(snap.val())
					})
				}
				else {
					this.setState({
						nowPlaying: undefined
					})
				}
			});
	}

	componentWillUnmount() {
		this.ref.off("value", this.onNowPlayingChanged);
	}

	navigateToAndClose(location) {
		this.props.onNavigateTo(location);
		this.props.onRequestChange(false);
	}

	logoutAndClose() {
		this.props.onLogout();
		this.props.onRequestChange(false);
	}

	render() {
		return (
			<LeftNav open={this.props.open} docked={false} onRequestChange={open => this.props.onRequestChange(open)}>
				<NowPlayingItem track={this.state.nowPlaying} />
				<Divider />
				<NavItem
					leftIcon={<AvQueueMusic />}
					primaryText="Spilleliste"
					onTouchTap={() => this.navigateToAndClose("/app")} />
				<NavItem
					leftIcon={<ActionHistory />}
					primaryText="Historikk"
					onTouchTap={() => this.navigateToAndClose("/app/history")} />
				<NavItem
					leftIcon={<ActionSettings />}
					primaryText="Innstillinger"
					onTouchTap={() => this.navigateToAndClose("/app/settings")} />

				{
					!this.props.isAdmin ? null:
					<div>
						<NavItem
							leftIcon={<HardwareSecurity />}
							primaryText="Administrator"
							onTouchTap={() => this.navigateToAndClose("/app/admin")} />

						{/* <NavItem
							leftIcon={<ActionGetApp />}
							primaryText="Last ned hearit player"
							onTouchTap={() => this.navigateToAndClose("/app/downloadPlayerInstructions")} /> */}
					</div>
				}

				<Divider />

				<NavItem
					leftIcon={<ActionPowerSettingsNew />}
					primaryText="Logg ut"
					onTouchTap={() => this.logoutAndClose()} />
			</LeftNav>
		)
	}
}

Nav.defaultProps = {
	open: false,
	onRequestChange: () => {}
}

function mapStateToProps(state) {
	return {
		roomId: state.getIn(["session", "roomId"]),
		isAdmin: state.getIn(["session", "isAdmin"])
	}
}

function mapDispatchToProps(dispatch) {
	return {
		onNavigateTo: (location) => dispatch(navigateTo(location)),
		onLogout: () => dispatch(logout())
	}
}

export default connect(mapStateToProps, mapDispatchToProps)(Nav);
