import { isEmpty } from 'lodash';
import { createAction } from 'redux-actions';
import { showError } from './errors';
import history from '../helpers/history';
import { receiveQueue } from './queue';
import { firebaseForRoomId } from 'helpers/firebase';
import Q from 'q';

export const SET_ROOM_ID = 'SET_ROOM_ID';
export const setRoomId = createAction(SET_ROOM_ID);

export const SET_AUTH_DATA = 'SET_AUTH_DATA';
export const setAuthData = createAction(SET_AUTH_DATA);

export const SET_IS_LOGGING_IN = 'SET_IS_LOGGING_IN';
export const setIsLoggingIn = createAction(SET_IS_LOGGING_IN);

export const SET_IS_ADMIN = "SET_IS_ADMIN";
export const setIsAdmin = createAction(SET_IS_ADMIN);

export function login(roomId) {
	return (dispatch, getState) => {
		const roomRef = firebaseForRoomId(roomId);

		return dispatch(validateAuth())
			.then(() => roomRef.once('value'))
			.then(snapshot => {
				if(!snapshot.exists()) {
					let message = `Spillelisten "${roomId}" finnes ikke`;
					dispatch(setRoomId(undefined));
					dispatch(showError(message));
					throw new Error(message);
				}

				dispatch(setRoomId(roomId));

				return roomId;
			})
			.catch(err => {
				dispatch(showError(err));
				
				// Rethrow, so the promise rejects
				throw err;
			});
	}
}

export function loginAndRedirect(roomId) {
	return (dispatch, getState) => {
		return dispatch(login(roomId))
			.then(() => {
				const isInApp = getState().get("router").isActive("/app");
				if(!isInApp) {
					history.push("/app");
				}
			})
	}
}

export function logout() {
	return (dispatch) => {
		dispatch(setRoomId(undefined));
		history.push("/");
	}
}


export function requestAdmin(message) {
	return (dispatch, getState) =>
		dispatch(validateAuth())
			.then(() => dispatch(roomRef()))
			.then((ref) => {
				const uid = dispatch(getUid());
				return ref
					.child("adminRequests")
					.child(uid)
					.set(message || "[ingen identifikasjon]")
			})
			.then(() => {
				console.log("success")
			}, (err) => {
				console.error(err)
			})
}

export function removeAdminRequest(uid) {
	return (dispatch) => dispatch(validateAuth())
		.then(() => dispatch(roomRef()))
		.then(ref => ref.child("adminRequests").child(uid).remove())
}

export function grantAdmin(uid) {
	return (dispatch) => dispatch(validateAuth())
		.then(() => dispatch(roomRef()))
		.then(ref => ref.child("admins").child(uid).set(true))
		.then(() => dispatch(removeAdminRequest(uid)))
}

export function roomRef() {
	return (dispatch, getState) => {
		let deferred = Q.defer();

		let state = getState();
		let roomId = state.getIn(["session", "roomId"]);

		if(isEmpty(roomId)) {
			deferred.reject(new Error("No room ID"));
		}
		else {
			deferred.resolve(firebaseForRoomId(roomId));
		}

		return deferred.promise;
	}
}

export function validateAuth() {
	return (dispatch, getState) => {
		const deferred = Q.defer();
		const state = getState();
		const session = state.get("session");

		if(session.get("authData")) {
			deferred.resolve();
		}
		else {
			deferred.reject(new Error("Invalid authentication"));
		}

		return deferred.promise;
	}
}

export function getUid() {
	return (dispatch, getState) =>
		getState().getIn(["session", "authData", "uid"]);
}
