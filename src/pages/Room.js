import React, { useState } from 'react';
import { useParams } from 'react-router';
import { LOCAL_VIDEO, useWebRTC } from '../hooks/useWebRTC';
import styled from '@emotion/styled';
import socket from '../socket';
import ACTIONS from '../socket/actions';
import { useNavigate } from 'react-router';
import {BsMic, BsCameraVideo} from 'react-icons/bs'
import {BiExit} from 'react-icons/bi'

const StyledPageContainer = styled.div`
    width: 100vw;
    height: 100vh;
    margin: 0;
    padding: 0;
    background-color: #3C3C3C;
    display: flex;
    flex-direction: column;
`;

const StyledVideo = styled.video`
    margin: .5rem;
    border-radius: 8px;
`;

const StyledButton = styled.button`
    background-color: ${(props) => props.color ? '#3C3C3C' : '#BB2020'};
    color: white;
    border-radius: 50px;
    width: 50px;
    height: 50px;
    margin-left: 3rem;
    margin-right: 3rem;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
`;


export default function Room(){
    const {id: roomId} = useParams();
    const [audio, setAudio] = useState(true);
    const [video, setVideo] = useState(true);
    const navigate = useNavigate();

    const {clients, provideMediaRef, muteVideo, muteAudio} = useWebRTC(roomId, audio, video);


    return <StyledPageContainer>
        <div style={{display: 'flex', flexWrap: 'wrap', height: '90vh', overflow: 'auto'}}>
        {
            clients.map((clientId) => {
                return (
                    <div key={clientId}>
                        <StyledVideo 
                            ref={instance => {
                                provideMediaRef(clientId, instance)
                            }}
                            autoPlay
                            playsInline
                            muted={clientId === LOCAL_VIDEO}
                        />
                    </div>
                )
            })
            
        }
        </div>
        <div style={{borderTop: '1px solid black', height: '10vh', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            <StyledButton onClick={() => {
                muteAudio(!audio)
                setAudio(!audio);
            }} color={audio} ><BsMic size={'2em'} /></StyledButton>
            <StyledButton onClick={() => {
                muteVideo(!video)
                setVideo(!video)
            }} color={video} ><BsCameraVideo size={'2em'} /></StyledButton>
            <StyledButton color={true} onClick={() => {
                socket.emit(ACTIONS.LEAVE)
                navigate('/')
            }}><BiExit size={'2em'} /></StyledButton>
        </div>
        </StyledPageContainer>;
}