import freeice from "freeice";
import { useCallback, useEffect, useRef, useState } from "react";
import socket from "../socket";
import ACTIONS, { REMOVE_PEER } from "../socket/actions";
import useStateWithCallback from "./useStateWithCallback";

export const LOCAL_VIDEO = 'LOCAL_VIDEO';

export function useWebRTC(roomId, audio, video) {
    const [clients, updateClient] = useStateWithCallback([]);

    const addNewClient = useCallback((newClient,cb) => {
        if(!clients.includes(newClient)){
            updateClient(list => [...list, newClient], cb)
        }
    }, [clients, updateClient])

    const peerContections = useRef({});
    const localMediaSteam = useRef(null);
    const peerMediaElements = useRef({
        [LOCAL_VIDEO]: null
    });


    useEffect(() => {
        async function handleNewPeer({peerID, createOffer}) {
            if(peerID in peerContections.current){
                return console.warn('Already connected');
            }

            peerContections.current[peerID] = new RTCPeerConnection( {
                iceServers: freeice()
            })

            peerContections.current[peerID].onicecandidate = event => {
                if(event.candidate) {
                    socket.emit(ACTIONS.RELAY_ICE, {
                        peerID,
                        iceCandidate: event.candidate
                    })
                }
            }

            let tracksNumber = 0;
            peerContections.current[peerID].ontrack = ({streams: [remoteStream]}) => {
                tracksNumber ++

                if(tracksNumber === 1) {
                    addNewClient(peerID, () => {
                        peerMediaElements.current[peerID].srcObject = remoteStream;
                    })
                }
               
            }

            localMediaSteam.current.getTracks().forEach(track => {
                peerContections.current[peerID].addTrack(track, localMediaSteam.current);
            })

            if(createOffer) {
                const offer = await peerContections.current[peerID].createOffer();

                await peerContections.current[peerID].setLocalDescription(offer);

                socket.emmit(ACTIONS.RELAY_SDP, {
                    peerID,
                    sessionDescription: offer
                })
            }
        }

        socket.on(ACTIONS.ADD_PEER, handleNewPeer)
    }, [])

    useEffect( () => {
        async function setRemoteMedia ({peerID, sessionDescription: remoteDescription}) {
            await peerContections.current[peerID].setRemoteDescription(
                new RTCSessionDescription(remoteDescription)
            );

            if(remoteDescription.type === 'offer'){
                const answer = await peerContections.current[peerID].createAnswer();

                await peerContections.current[peerID].setLocalDescription(answer);

                socket.emit(ACTIONS.RELAY_SDP, {
                    peerID,
                    sessionDescription: answer
                })
            }
        }

        socket.on(ACTIONS.SESSION_DESCRIPTION, setRemoteMedia);
    }, [])

    useEffect( () => {
        socket.on(ACTIONS.ICE_CANDIDATE, ({peerID, iceCandidate}) => {
            peerContections.current[peerID].addIceCandidate(
                new RTCIceCandidate(iceCandidate)
            )
        })
    }, [] );

    useEffect(() => {
        function handleDisconnect({peerID}){
            if(peerContections.current[peerID]){
                peerContections.current[peerID].close();
            }

            delete peerContections.current[peerID];
            delete peerMediaElements.current[peerID];

            updateClient( list => list.filter(c => c !== peerID))
        }

        socket.on(ACTIONS.REMOVE_PEER, handleDisconnect)
    }, []);

    useEffect(() => {
        async function startCapture() {
            localMediaSteam.current = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: true
            });

            addNewClient(LOCAL_VIDEO, () => {
                const localVideoElement = peerMediaElements.current[LOCAL_VIDEO];
                if(localVideoElement){
                    localVideoElement.volume = 0;
                    localVideoElement.srcObject = localMediaSteam.current;
                }
            })
        }

        startCapture().then(() => socket.emit(ACTIONS.JOIN, {room: roomId})).catch(e => console.log(e))

        

    }, [roomId])

    const muteAudio = (value) => {
        localMediaSteam.current.getAudioTracks()[0].enabled = value;
    }
    const muteVideo = (value) => {
        localMediaSteam.current.getVideoTracks()[0].enabled = value;
        peerContections.current[socket.id].getVideoTracks()[0].enabled = value;
    }

    const provideMediaRef = useCallback((id, node) => {
        peerMediaElements.current[id] = node;
    }, [])

    console.log(clients)

    return {clients, provideMediaRef, muteVideo, muteAudio};
}