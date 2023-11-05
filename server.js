import PocketBase from 'pocketbase';
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import axios from 'axios';

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// const pb = new PocketBase('http://192.168.43.74:1001');
const uriPBLokal = 'http://192.168.43.75:1001';
const uriPBOnline = 'https://yo-pb.pockethost.io';
// const uriPB = uriPBLokal;
const uriPB = uriPBOnline;
const pb = new PocketBase(uriPB);

async function updateOnlinePengguna(data) {

  let resultList = [];
  let collectionName = ""
  let penggunaSelectedItems = []
  if (data['is_pengguna_anonim'] == true) {
    const config = {
      method: 'get',
      maxBodyLength: Infinity,
      url: `${uriPB}/api/collections/pengguna_anonim/records?filter=(imei='${data['imei']}')`,
      headers: {}
    };

    try {
      const response = await axios.request(config);

      resultList = response.data;
    } catch (error) {
      console.error(error);
    }

    collectionName = "pengguna_anonim"
  } else if (data['is_pengguna_pembeli'] == true) {
    const config = {
      method: 'get',
      maxBodyLength: Infinity,
      url: `${uriPB}/api/collections/pengguna_pembeli/records?filter=(id='${data['id_pengguna']}')`,
      headers: {}
    };

    try {
      const response = await axios.request(config);

      resultList = response.data;
    } catch (error) {
      console.error(error);
    }

    collectionName = "pengguna_pembeli"
  } else if (data['is_pengguna_penjual'] == true) {
    const config = {
      method: 'get',
      maxBodyLength: Infinity,
      url: `${uriPB}/api/collections/pengguna_penjual/records?filter=(id='${data['id_pengguna']}')`,
      headers: {}
    };

    try {
      const response = await axios.request(config);

      resultList = response.data;
    } catch (error) {
      console.error(error);
    }

    collectionName = "pengguna_penjual"
  }
  
  penggunaSelectedItems = resultList.items
  
  if (penggunaSelectedItems.length != 0) {
    const penggunaSelectedObj = penggunaSelectedItems[0]

    const timestamp = new Date().getTime();

    let timestamp_offline = 0;
    if (penggunaSelectedObj.online_details != null) {
      timestamp_offline = penggunaSelectedObj.online_details.timestamp_offline
    }

    const online_details = {
      timestamp_online: timestamp,
      timestamp_offline: timestamp_offline
    }

    let payload = JSON.stringify({
      "is_online": true,
      "id_socket": data['socket_id'],
      "online_details": online_details,
    });

    let config = {
      method: 'patch',
      maxBodyLength: Infinity,
      url: `${uriPB}/api/collections/${collectionName}/records/${penggunaSelectedObj.id}`,
      headers: {
        'Content-Type': 'application/json'
      },
      data: payload
    };

    try {
      const response = await axios.request(config);

      return new Promise((success, failed) => {
        success(response.data)
      })
    } catch (error) {
      console.error(error);
    }

  }

}

async function updateOfflinePengguna(id_socket) {

  let isKetemu = false;
  let resultList = []
  let penggunaSelectedItems = []
  let collectionName = ""

  if (!isKetemu) {

    const config = {
      method: 'get',
      maxBodyLength: Infinity,
      url: `${uriPB}/api/collections/pengguna_penjual/records?filter=(id_socket='${id_socket}')`,
      headers: {}
    };

    try {
      const response = await axios.request(config);

      resultList = response.data;
    } catch (error) {
      console.error(error);
    }

    if (resultList.totalItems == 0) {
      console.log("GAK KETEMU id_socket di collection pengguna_penjual");
    } else {
      isKetemu = true
      collectionName = "pengguna_penjual"
      console.log("KETEMU id_socket di collection pengguna_penjual");
      penggunaSelectedItems = resultList.items
    }
  }

  if (!isKetemu) {
    const config = {
      method: 'get',
      maxBodyLength: Infinity,
      url: `${uriPB}/api/collections/pengguna_pembeli/records?filter=(id_socket='${id_socket}')`,
      headers: {}
    };

    try {
      const response = await axios.request(config);

      resultList = response.data;
    } catch (error) {
      console.error(error);
    }

    if (resultList.totalItems == 0) {
      console.log("GAK KETEMU id_socket di collection pengguna_pembeli");
    } else {
      isKetemu = true
      collectionName = "pengguna_pembeli"
      console.log("KETEMU id_socket di collection pengguna_pembeli");
      penggunaSelectedItems = resultList.items
    }
  }

  if (!isKetemu) {

    const config = {
      method: 'get',
      maxBodyLength: Infinity,
      url: `${uriPB}/api/collections/pengguna_anonim/records?filter=(is_online != false)`,
      headers: {}
    };

    try {
      const response = await axios.request(config);

      const items = response.data.items
      for (let i = 0; i < items.length; i++) {
        if (items[i].id_socket == id_socket && items[i].is_online != false) {
          resultList = items[i];
        }
      }

    } catch (error) {
      console.error(error);
    }

    if (resultList.length == 0) {
      console.log("GAK KETEMU id_socket di collection pengguna_anonim");
    } else {
      isKetemu = true
      collectionName = "pengguna_anonim"
      console.log("KETEMU id_socket di collection pengguna_anonim");
      // penggunaSelectedItems = resultList
      penggunaSelectedItems.push(resultList)
      console.log(penggunaSelectedItems);
    }
  }

  if (penggunaSelectedItems.length != 0) {
    const penggunaSelectedObj = penggunaSelectedItems[0]

    const timestamp = new Date().getTime();

    let timestamp_online = 0;
    if (penggunaSelectedObj.online_details != null) {
      timestamp_online = penggunaSelectedObj.online_details.timestamp_online
    }

    const online_details = {
      timestamp_online: timestamp_online,
      timestamp_offline: timestamp
    }

    let record;

    let payload = JSON.stringify({
      "is_online": false,
      "id_socket": id_socket,
      "online_details": online_details,
    });

    let config = {
      method: 'patch',
      maxBodyLength: Infinity,
      url: `${uriPB}/api/collections/${collectionName}/records/${penggunaSelectedObj.id}`,
      headers: {
        'Content-Type': 'application/json'
      },
      data: payload
    };

    try {
      const response = await axios.request(config);

      record = response.data;
    } catch (error) {
      console.error(error);
    }
    
    return new Promise((success, failed) => {
      success(record)
    })
  } else {
    return new Promise((success, failed) => {
      const obj = {
        "message": "id_socket tidak ditemukan / user mode non lokasi"
      }

      success(obj)
    })
  }

}

io.on('connection', function (client) {

  console.log("");
  console.log('client connect...', client.id);

  client.on('connect', function () {
    console.log("");
    console.log('client connect = ', client.id)
  })

  client.on('disconnect', async function () {
    console.log('client disconnect = ', client.id)
    // handleDisconnect()

    const _updateOfflinePengguna = await updateOfflinePengguna(client.id)
    console.log("");
    console.log(`_updateOfflinePengguna = `);
    console.log(_updateOfflinePengguna);
  })

  // Menangani data JSON yang diterima dari Flutter
  client.on('sendDataToServer', async function (data) {
    // console.log("");
    console.log('Received data from Flutter:', data);
    
    const _updateOnlinePengguna = await updateOnlinePengguna(data)
    console.log("");
    console.log(`_updateOnlinePengguna = `);
    console.log(_updateOnlinePengguna);

  });

  client.on('error', function (err) {
    console.log('received error from client:', client.id)
    console.log(err)
  })
})

app.get('/status', (req, res) => {
  res.status(200).json({ message: 'API is running' });
});

var server_port = process.env.PORT || 3000;
server.listen(server_port, function (err) {
  if (err) throw err
  console.log('Listening on port %d', server_port);
});
