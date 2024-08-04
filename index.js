
AWS.config.update({
    //accessKeyId: '',         Reemplaza con tu Access Key ID
    //secretAccessKey: '', // Reemplaza con tu Secret Access Key
    //sessionToken: '',
    region: 'us-east-1'                      // Reemplaza con la región de tu bucket
});

const s3 = new AWS.S3();
const bucketName = 'usersdynamotaller';     // Reemplaza con el nombre de tu bucket


document.addEventListener('DOMContentLoaded', () => {
    const registerBtn = document.getElementById('register-btn');
    const viewBtn = document.getElementById('view-btn');
    const registerView = document.getElementById('register-view');
    const viewAll = document.getElementById('view-all');
    const fetchRecordsBtn = document.getElementById('fetch-records');
    const recordsList = document.getElementById('records-list');
    const responseContainer = document.getElementById('response-message');
    registerBtn.addEventListener('click', () => {
        registerView.classList.add('active');
        viewAll.classList.remove('active');
        registerBtn.classList.add('active');
        viewBtn.classList.remove('active');
    });

    viewBtn.addEventListener('click', () => {
        registerView.classList.remove('active');
        viewAll.classList.add('active');
        registerBtn.classList.remove('active');
        viewBtn.classList.add('active');
    });

    document.getElementById('dynamo-form').addEventListener('submit', async (event) => {
        event.preventDefault();

        const cedula = document.getElementById('cedula').value;
        const nombres = document.getElementById('nombre').value;
        const apellidos = document.getElementById('apellidos').value;
        const correo = document.getElementById('correo').value;
        const foto = document.getElementById('image').files[0];

        async function uploadPhotoToS3(photo) {
            const params = {
                Bucket: bucketName,
                Key: photo.name,
                Body: photo
                // Elimina la opción de ACL
            };

            try {
                const data = await s3.upload(params).promise();
                return data.Location; // URL del archivo subido
            } catch (err) {
                console.error('Error subiendo el archivo:', err);
                return null;
            }
        }
        const photoURL = await uploadPhotoToS3(foto);

        const payload = {
            TableName: 'EventUsers', // Asegúrate de usar el nombre correcto de la tabla
            Item: {
                id: cedula,
                nombres: nombres,
                apellidos: apellidos,
                correo: correo,
                photoURL: photoURL
            }
        };

        try {
            const response = await fetch('https://l09xls5syl.execute-api.us-east-1.amazonaws.com/default/FormEvent', {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const result = await response.json();
            responseContainer.innerHTML = `<p>Elemento agregado con éxito.</p>`;
        } catch (error) {
            document.getElementById('response-message').innerText = `Error: ${error.message}`;
        }
    });

    fetchRecordsBtn.addEventListener('click', async () => {
        try {
            const response = await fetch('https://l09xls5syl.execute-api.us-east-1.amazonaws.com/default/FormEvent?TableName=EventUsers', {
                method: 'GET'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const result = await response.json();
            const items = result.resultado.Items;

            if (items.length === 0) {
                recordsList.innerHTML = '<p>No records found.</p>';
            } else {
                recordsList.innerHTML = items.map(item => `
                    <div class="record">
                        <p><strong>ID:</strong> ${item.id}</p>
                        <p><strong>Nombre:</strong> ${item.nombres}</p>
                        <p><strong>Apellidos:</strong> ${item.apellidos}</p>
                        <p><strong>Correo:</strong> ${item.correo}</p>
                        <p><strong>URL Image:</strong> <a href=${item.photoURL}>${item.photoURL}</a></p>
                    </div>
                `).join('');
            }
        } catch (error) {
            recordsList.innerHTML = `<p>Error: ${error.message}</p>`;
        }
    });
});
