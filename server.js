const express = require('express'); //express 라우링
const app = express(); //express 기본 라우팅
const port = 9070;
const cors = require('cors'); //cors: 크로스 도메인요청을 허용
const mysql = require('mysql');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const SECRET_KEY = 'test';

app.use(cors()); //교차출처 공유 허용
app.use(express.json()); //json 본문 파싱 미들웨어

// sql db연결정보
connection = mysql.createConnection({
  host:'database',
  user:'root',
  password:'1234',
  database:'kdt'
});

//db연결 실패시 에러 출력하기
connection.connect((err)=>{
  if(err){
    console.log('MYSQL 연결실패 :', err);
    return;
  }
  console.log('MYSQL 연결 성공');
})


app.listen(port, ()=>{
  console.log(`Server running at http://localhost:${port}`);
});

//회원가입시 사용자가 입력한 데이터를 가져와서 요청된 정보를 처리하여 응답을 해준다.
app.post('/register', async (req, res) => {
  try {
    const { username, password, tel, email } = req.body;
    const hash = await bcrypt.hash(password, 10); // 비밀번호 암호화

    connection.query(
      'INSERT INTO ginipet_users (username, password, tel, email) VALUES (?,?,?,?)',
      [username, hash, tel, email],
      (err) => {
        if (err) {
          if (err.code == 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: '이미 존재하는 아이디입니다.' });
          }
          return res.status(500).json({ error: '회원가입실패' });
        }
        res.json({ success: true });
      }
    );
  } catch (error) {
    res.status(500).json({ error: '회원가입실패' });
  }
});

//로그인폼에서 전달받은 username, password값을 처리한다.
app.post('/login', (req,res) =>{
  const {username,password} = req.body;
  connection.query('SELECT * FROM ginipet_users WHERE username=?', [username], async(err, result)=>{
    if(err||result.length===0){
      return res.status(401).json({ error : '아이디 또는 비밀번호가 틀렸습니다.'})
    }
    const user = result[0];
    const isMatch = await bcrypt.compare(password,user.password);
    console.log('입력비번:', password);
    console.log('DB비번:', user.password);
    console.log('비번일치:', isMatch);

    if(!isMatch){
      return res.status(401).json({ error : '아이디 또는 비밀번호가 틀렸습니다.'})
    }

    //토큰 생성시 1시간 설정
    const token = jwt.sign({id:user.id, username:user.username}, SECRET_KEY,{
      expiresIn:'1h'});
      //토큰 발급
      res.json({token});
  })
})

//로그인시 사용자가 입력한 id,password를 받아서 요청된 정보를 처리하여 응답을 해준다.
app.get('/join', (req,res)=>{
  //res.json('Excuse from backend');
});

