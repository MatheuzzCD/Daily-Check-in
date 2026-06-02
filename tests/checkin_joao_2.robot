*** Settings ***
Library    SeleniumLibrary

Suite Setup       Dado que o usuário acessa a tela de check-in
Suite Teardown    E fecha o navegador

*** Variables ***
${URL}                  http://localhost:3000/checkin
${BROWSER}              chrome
${BOTAO_CHECKIN}        id=btnCheckin
${MENSAGEM}             id=mensagem

*** Test Cases ***
CT01 - Deve registrar check-in com usuário autenticado
    Dado que o usuário está autenticado
    E ainda não realizou check-in hoje
    Quando clicar no botão de check-in
    Então o sistema deve apresentar a mensagem    Check-in registrado com sucesso

CT02 - Deve bloquear check-in duplicado
    Dado que o usuário está autenticado
    E já realizou check-in hoje
    Quando clicar no botão de check-in
    Então o sistema deve apresentar a mensagem    Check-in já realizado hoje

CT03 - Deve redirecionar usuário não autenticado
    Dado que o usuário não está autenticado
    E ainda não realizou check-in hoje
    Quando acessar a tela de c
