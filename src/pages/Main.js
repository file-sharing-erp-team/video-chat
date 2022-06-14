import React, {useEffect, useRef, useState} from 'react';
import { useNavigate } from 'react-router';
import socket from '../socket'
import ACTIONS from '../socket/actions';
import { v4 } from 'uuid';

export default function Main() {
    const navigate = useNavigate();
    const [rooms, updateRooms] = useState([]);
    const rootNode = useRef();

    useEffect(() => {
        socket.on(ACTIONS.SHARE_ROOMS, ({rooms = []}= {}) => {
            if(rootNode.current){
                updateRooms(rooms)
            }
           
        })
    }, [])

    return <div ref={rootNode}>
        <h1>Доступные комнаты</h1>

        <button onClick={() => {
            navigate(`/room/${v4()}`)
        }}>Создать новую комнату</button>

        {
            rooms.map((room, index) => {
                return <span key={index} onClick={() => {
                    navigate(`/room/${room}`)
                }}>{room}</span>
            })
        }
    </div>;
}