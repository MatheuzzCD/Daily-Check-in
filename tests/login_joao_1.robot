*** Settings ***
Library    SeleniumLibrary

Suite Setup       Dado que o usuário acessa a tela de login
Suite Teardown    E fecha o navegador

*** Variables ***
${URL}              http://localhost:3000/login
${BROWSER}          chrome
${INPUT_EMAIL}      id=email
${INPUT_SENHA}      id=senha
${BOTAO_LOGIN}      id=btnLogin
${MENSAGEM}         id=mensagem

*** Test Cases ***
CT01 - Deve realizar login com credenciais válidas
    Dado que o usuário informa o email    idoso@teste.com
    E informa a senha    123456
    Quando solicitar o login
    Então o sistema deve apresentar a mensagem    Acesso permitido

CT02 - Deve validar e-mail não cadastrado
    Dado que o usuário informa o email    naoexiste@teste.com
    E informa a senha    123456
    Quando solicitar o login
    Então o sistema deve apresentar a mensagem    Credenciais inválidas

CT03 - Deve validar senha incorreta
    Dado que o usuário informa o email    idoso@teste.com
    E informa a senha    senhaerrada
    Quando solicitar o login
    Então o sistema deve apresentar a mensagem    Credenciais inválidas

CT04 - Deve validar campos vazios
    Dado que o usuário informa o email    ${EMPTY}
    E informa a senha    ${EMPTY}
    Quando solicitar o login
    Então o sistema deve apresentar a mensagem    Preencha todos os campos

*** Keywords ***
Dado que o usuário acessa a tela de login
    Open Browser    ${URL}    ${BROWSER}
    Maximize Browser Window

Dado que o usuário informa o email
    [Arguments]    ${email}=${EMPTY}
    Input Text    ${INPUT_EMAIL}    ${email}

E informa a senha
    [Arguments]    ${senha}=${EMPTY}
    Input Password    ${INPUT_SENHA}    ${senha}

Quando solicitar o login
    Click Button    ${BOTAO_LOGIN}

Então o sistema deve apresentar a mensagem
    [Arguments]    ${mensagem}
    Element Text Should Be    ${MENSAGEM}    ${mensagem}

E fecha o navegador
    Close Browser
