------------------------------- apagar registro
npx prisma studio

apaga o registro quando o botao é clicado
--------------------------------------------
remove no console do navegador o registro do login (registro do login, nao do botao apertado)
localStorage.removeItem('token');
localStorage.removeItem('user');
location.reload();
