const express = require('express'); //express 기본 라우팅
const app = express(); //express 기본 라우팅
const port = 9070;
const cors = require('cors'); //교차출처공유 허용하기 위함
const mysql = require('mysql'); //mysql변수 선언
const bcrypt = require('bcrypt'); //해시 암호화를 위함
const jwt = require('jsonwebtoken'); //토큰 생성을 위함
const SECRET_KEY = 'test';

app.use(cors());
app.use(express.json()); //JSON 본문 파싱 미들웨어



//1. mysql 연결 정보 셋팅
const connection = mysql.createConnection({
  host:'database',
  user:'root',
  password:'1234',
  database:'kdt'
});

//2. MYSQL DB접속시 오류가 나면 에러 출력하기, 성공하면 '성공'표시하기
connection.connect((err)=>{
  if(err){
    console.log('MYSQL연결 실패 : ', err);
    return;
  }
  console.log('MYSQL연결 성공');
});

// //3. post방식으로 전달받은 로그인 폼에서 데이터를 DB에 조회하여 결과값을 리턴함.
// app.post('/login', (req, res) =>{
//   const {username, password} = req.body;

//   connection.query('SELECT * FROM users WHERE username=?', [username], async(err, result) => {
//     if(err||result.length===0){
//       return res.status(401).json({error:'아이디 또는 비밀번호가 틀립니다.'});
//     }
//     const user = result[0];

//     const isMatch = await bcrypt.compare(password, user.password);

//     if(!isMatch){
//       return res.status(401).json({error : '아이디 또는 비밀번호가 틀립니다.'})
//     }
//     //토큰 생성(1시간)
//     const token = jwt.sign({id:user.id, username:user.username}, SECRET_KEY, {expiresIn:'1h'});

//     //토큰 발급
//     res.json({token});
//   })
// })

app.post('/login2', (req, res) => {
  const {username2, user_pw} = req.body;

  connection.query('SELECT * FROM users2 WHERE username2=?', [username2],
    async(err, result) => {
      if(err||result.length===0){
        return res.status(401).json({error : '아이디 또는 비밀번호가 틀립니다.'});
      }
      const user2 = result[0];
      const isMatch = await bcrypt.compare(user_pw,user2.user_pw);
      if(!isMatch){
        return res.status(401).json({error : '아이디 또는 비밀 번호가 틀립니다.'})
      }
      const token = jwt.sign({id:user2.id, username2:user2.username2},
        SECRET_KEY, {expiresIn:'1h'});
        res.json({token});
    }
  )
})

//4. REsister.js에서 넘겨 받은 username, password를 sql db에 입력하여 추가한ㄷ,
app.post('/register', async (req, res)=>{
  const {username, password} = req.body;
  const hash = await bcrypt.hash(password, 10); //패스워드 hash암호화

  connection.query(
    'INSERT INTO users (username, password) VALUES (?, ?)',
    [username, hash],
    (err) => {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          return res.status(400).json({ error: '이미 존재하는 아이디입니다.' });
        } else {
          return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
        }
      }
        res.json({ success: true });
      }
    )
  });

  app.post('/register2', async (req, res)=>{
    const {username2, user_pw} = req.body;
    const hash = await bcrypt.hash(user_pw, 10);

    connection.query(
      'INSERT INTO users2 (username2, user_pw) VALUES (?,?)',
      [username2, hash],
      (err) => {
        if (err) {
          if(err.code === 'ER_DUP_ENTRY'){
            return res.status(400).json({ error: '이미 존재하는 아이디 입니다.'});
          }else{
            return res.status(500).json({ error : '서버 오류가 발생했습니다.'});
          }
        }
        res.json({success: true});
      } 
    )
  })

//방법1. db연결 테스트 - 메세지만 확인하기 위함
// app.get('/', (req,res)=>{
//   //특정 경로로 요청된 정보를 처리
//   res.json('Excused from Backend');
// });

//방법2. SQL쿼리문을 사용하여 DB에서 조회된 데이터를 출력한다.(Read)

//1. 상품목록 조회하기(goods)
//상품목록은 상품코드(g_code), 상품명(g_name), 상품가격(g_cost)으로 구성되어 있다.
app.get('/goods', (req,res)=>{
  connection.query("SELECT * FROM goods ORDER BY goods.g_code DESC", (err, results)=>{
    if(err){
      console.log('쿼리문 오류 : ', err);
      res.status(500).json({error: 'DB쿼리 오류'});
      return;
    }
    res.json(results);
  })
});

//1. 상품목록 조회하기(books)
app.get('/books', (req, res) => {
  connection.query("SELECT * FROM book_store ORDER BY book_store.num DESC", (err,   results)=>{
    if(err){
      console.log('쿼리문 오류 : ', err);
      res.status(500).json({error: 'DB쿼리 오류'});
      return;
    }
    res.json(results);
  })
});

//1. 상품목록 조회하기(fruits)
app.get('/fruits', (req, res) => {
  connection.query("SELECT * FROM fruit ORDER BY fruit.num DESC", (err,   results)=>{
    if(err){
      console.log('쿼리문 오류 : ', err);
      res.status(500).json({error: 'DB쿼리 오류'});
      return;
    }
    //json데이터로 결과를 저장
    res.json(results);
  })
});

//2. 상품삭제(goods)
//상품삭제는 상품코드(g_code)를 기준으로 삭제한다.
app.delete('/goods/:g_code', (req, res) => {
  const g_code = req.params.g_code;
  connection.query(
    'DELETE FROM goods WHERE g_code = ?',
    [g_code],
    (err, result) => {
      if (err) {
        console.log('삭제 오류:', err);
        res.status(500).json({ error: '상품 삭제 실패' });
        return;
      }
      res.json({ success: true });
    }
  );
});

//2. 상품삭제(books)
app.delete('/books/:num', (req, res) => {
  const num = req.params.num;
  connection.query(
    'DELETE FROM book_store where num=?', [num], (err, result) => {
      if(err){
        console.log('삭제 오류 : ', err);
        res.status(500).json({err : '상품 삭제 실패'});
        return;
      }
      res.json({success:true});
    }
  )
});

//2. 상품삭제(fruit)
app.delete('/fruits/:num', (req, res) => {
  const num = req.params.num;
  connection.query(
    'DELETE FROM fruit where num=?', [num], (err, result) => {
      if(err){
        console.log('삭제 오류 : ', err);
        res.status(500).json({err : '상품 삭제 실패'});
        return;
      }
      res.json({success:true});
    }
  )
});

//3. 상품수정 goods(UPDATE)
//상품수정은 상품코드(g_code)를 기준으로 수정한다.
app.put('/goods/update/:g_code', (req, res)=>{
  const g_code = req.params.g_code;
  const {g_name, g_cost} = req.body;

  //update쿼리문 작성하여 실행
  connection.query(
    'UPDATE goods SET g_name = ?, g_cost= ? where g_code= ?', [g_name, g_cost, g_code],
    (err, result) => {
      if(err){
        console.log('수정 오류 : ', err);
        res.status(500).json({error : '상품 수정하기 실패'});
        return;
      }
      res.json({success:true});
    }
  );
});

//3. 상품수정 books(update)
app.put('/books/update/:num', (req, res)=>{
  const num = req.params.num;
  const { name, area1, area2, area3, BOOK_CNT, owner_nm, tel_num } = req.body;
  const bookCntNumber = Number(BOOK_CNT)

  // 필수값 체크
  if (!name || !area1 || !area2 || !area3 || isNaN(bookCntNumber) || !owner_nm || !tel_num) {
    return res.status(400).json({ error: '필수 항목이 누락되었습니다. 다시 확인하세요.' });
  }

  connection.query(
    'UPDATE book_store SET name=?, area1=?, area2=?, area3=?, BOOK_CNT=?, owner_nm=?, tel_num=? WHERE num=?',
    [name, area1, area2, area3, book_cnt, owner_nm, tel_num, num],
    (err, result) => {
      if (err) {
        console.log('수정 오류 : ', err);
        res.status(500).json({ error: '상품 수정하기 실패' });
        return;
      }
      res.json({ success: true });
    }
  );
});

//3. 상품수정 fruits(update)
app.put('/fruits/update/:num', (req, res)=>{
  const num = req.params.num;
  const { name, price, color, country } = req.body;

  // 필수값 체크
  if (!name || !price || !color || !country) {
    return res.status(400).json({ error: '필수 항목이 누락되었습니다. 다시 확인하세요.' });
  }

  connection.query(
    'UPDATE fruit SET name=?, price=?, color=?, country=? WHERE num=?',
    [name, price, color, country, num],
    (err, result) => {
      if (err) {
        console.log('수정 오류 : ', err);
        res.status(500).json({ error: '상품 수정하기 실패' });
        return;
      }
      res.json({ success: true });
    }
  );
});

//4. goods 상품 조회하기 (SELECT)
app.get('/goods/:g_code', (req, res) => {
  const g_code = req.params.g_code;

  connection.query(
    'SELECT * FROM goods WHERE g_code = ?',
    [g_code],
    (err, results) => {
      if (err) {
        console.log('조회 오류:', err);
        res.status(500).json({ error: '상품 조회 실패' });
        return;
      }

      if (results.length === 0) {
        res.status(404).json({ error: '해당 상품이 없습니다.' });
        return;
      }

      res.json(results[0]); // 단일 객체만 반환
    }
  );
});

//4. books 상품 조회하기 (SELECT)
app.get('/books/:num', (req, res) => {
  const num = req.params.num;

  connection.query(
    'SELECT * FROM book_store WHERE num = ?',
    [num],
    (err, results) => {
      if (err) {
        console.log('조회 오류:', err);
        res.status(500).json({ error: '상품 조회 실패' });
        return;
      }

      if (results.length === 0) {
        res.status(404).json({ error: '해당 상품이 없습니다.' });
        return;
      }

      res.json(results[0]); // 단일 객체만 반환
    }
  );
});

//4. fruits 상품 조회하기 (SELECT)
app.get('/fruits/:num', (req, res) => {
  const num = req.params.num;

  connection.query(
    'SELECT * FROM fruit WHERE num = ?',
    [num],
    (err, results) => {
      if (err) {
        console.log('조회 오류:', err);
        res.status(500).json({ error: '상품 조회 실패' });
        return;
      }

      if (results.length === 0) {
        res.status(404).json({ error: '해당 상품이 없습니다.' });
        return;
      }

      res.json(results[0]); // 단일 객체만 반환
    }
  )
});

//5. goods 상품등록하기(create, insert into)
app.post('/goods', (req, res)=>{
  const {g_name, g_cost} = req.body; 
  if(!g_name||!g_cost){
    return res.status(400).json({error:'필수 항목이 누락되었습니다. 다시 확인하세요.'});
  }

  //쿼리문 실행
  connection.query(
    'INSERT INTO goods (g_name, g_cost) VALUES (?, ?)', [g_name, g_cost], (err, result) => {
      if(err){
        console.log('DB등록 실패 :', err);
        res.status(500).json({error : '상품 등록 실패'});
        return;
      }
      res.json({success:true, insertId: result.insertId});
    }
  );
});

//5. books 상품등록하기
app.post('/books', (req, res)=>{
  const{name, area1, area2, area3, book_cnt, owner_nm, tel_num} = req.body;
  if (!name || !area1 || !area2 || !area3 || !book_cnt || !owner_nm || !tel_num) {
  return res.status(400).json({ error: '필수 항목이 누락되었습니다. 다시 확인하세요.' });
  }

//book_store db입력을 위한 쿼리문 실행
  connection.query(
    'INSERT INTO book_store (name, area1, area2, area3, BOOK_CNT, owner_nm, tel_num) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [name, area1, area2, area3, book_cnt, owner_nm, tel_num],
    (err, result) => {
      if (err) {
        console.log('등록 오류:', err);
        res.status(500).json({ error: '상품 등록 실패' });
        return;
      }
      res.json({ success: true, insertedId: result.insertId });
    }
  );
});

//5. fruits 상품등록하기
app.post('/fruits', (req, res)=>{
  const{name, price, color, country} = req.body;
  if (!name || !price || !color || !country) {
  return res.status(400).json({ error: '필수 항목이 누락되었습니다. 다시 확인하세요.' });
  }

  // fruit db입력을 위한 쿼리문 실행
  connection.query(
    'INSERT INTO fruit (name, price, color, country) VALUES (?, ?, ?, ?)',
    [name, price, color, country],
    (err, result) => {
      if (err) {
        console.log('등록 오류:', err);
        res.status(500).json({ error: '상품 등록 실패' });
        return;
      }
      res.json({ success: true, insertedId: result.insertId });
    }
  )  
});

//6. question 등록하기
app.post('/question', (req, res)=>{
  const{name, tel, email, txtbox} = req.body;
  if(!name||!tel||!email||!txtbox){
    return res.status(400).json({error:'필수 항목이 누락되었습니다. 다시 확인하세요. '});
  }
  //변수에 저장된 데이터를 sql쿼리문으로 DB에 입력함.
  connection.query(
    'INSERT INTO question (name, tel, email, txtbox) VALUES (?, ?, ?, ?)',
    [name, tel, email, txtbox],
    (err, result) => {
      if (err) {
        console.log('등록 오류:', err);
        res.status(500).json({ error: '데이터 입력 오류' });
        return;
      }
      res.send('질문 등록 완료');
    });
});



// 회원가입
app.post('/join', async(req,res)=>{
  const {userid, password, nickname, email}= req.body;
  const hash = await bcrypt.hash(password, 10);

  connection.query(
    "INSERT INTO rego_user (userid, password, nickname, email) VALUES (?,?,?,?)", [userid, hash, nickname, email],(err)=>{
      if(err){
        if(err.code == 'ER_DUP_ENTRY'){
          return res.status(400).json({error:'이미 존재하는 아이디입니다.'});
        }
        return res.status(500).json({error:'회원가입실패'});
      }
      res.json({success:true});
    }
  );
});
// 로그인
app.post('/login',(req,res)=>{
  const {userid, password} = req.body;

  connection.query('SELECT * FROM rego_user WHERE userid=?', [userid], (err, result)=>{
    if(err||result.length===0){
      return res.status(401).json({error:'아이디 또는 비밀번호를 확인해주세요.'});
    }
    const user = result[0];

    bcrypt.compare(password, user.password,(err, isMatch) =>{
    if(err || !isMatch){
      return res.status(401).json({error: '아이디 또는 비밀번호를 확인해주세요.'});
    }

    const token = jwt.sign({id:user.id, userid:user.userid}, SECRET_KEY,{expiresIn:'1h'});

    res.json({token, nickname:user.nickname});
  });
});
});

//장바구니 조회
app.get('/cart', (req,res) => {
  const {userId} = req.query;

  connection.query(
    'SELECT * FROM cart WHERE userid =? ORDER BY no DESC',
    [userId],
    (err, results) => {
      if(err) return res.status(500).json({ error: 'DB 조회 실패'});
      res.json(results);
    }
  );
});

//장바구니 추가
app.post('/cart', (req, res) => {
  const { userId, product } = req.body;
  if (!userId || !product) {
    return res.status(400).json({ error: '필수값 누락' });
  }
  connection.query(
    'INSERT INTO cart (userid, title, `desc`, img, price) VALUES (?,?,?,?,?)',[userId, product.title, product.desc,product.img,product.price],
    (err, result) => {
      if(err) {
        console.error('장바구니 추가 에러 :', err); 
        return res. status(500).json({ error: '장바구니 추가 실패' });
      } 
      res.json({success:true});
    }
  );
});
//장바구니 삭제
app.delete('/cart/:no', (req, res) => {
  const no = req.params.no;

  connection.query(
    'DELETE FROM cart WHERE no = ?', [no],
    (err, result) => {
      if (err) {
        console.error('삭제 오류:', err);
        return res.status(500).json({ error: '상품 삭제 실패' });
      }
      res.json({ success: true });
    }
  );
});

// 상품 목록 조회 (전체)
app.get('/mypage/:userid', (req, res) => {
  const {userid} = req.params;
  connection.query(
    'SELECT * FROM selling WHERE userid=? ORDER BY id DESC',[userid],
    (err, results) => {
      if (err) return res.status(500).json({ error: '상품 목록 조회 실패' });
      res.json(results);
    }
  );
});

// 상품 상세 조회
app.get('/mypage/item/:id', (req, res) => {
  const { id } = req.params;
  connection.query(
    'SELECT * FROM selling WHERE id = ?',
    [id],
    (err, results) => {
      if (err) return res.status(500).json({ error: '상품 조회 실패' });
      if (results.length === 0) return res.status(404).json({ error: '상품을 찾을 수 없습니다.' });
      res.json(results[0]);
    }
  );
});


// 상품 등록
app.post('/write', (req, res) => {
  const { img, title, cate, price, status, desc, delivery,userid } = req.body;
  const sql = `INSERT INTO selling (img, title, cate, price, status, \`desc\`, delivery, userid)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
  connection.query(sql, [img, title, cate, price, status, desc, delivery, userid], (err, result) => {
    if (err){
      console.error(err);
      return res.status(500).json({ error: '상품 등록 실패' });
    }
      res.json({ id: result.insertId });
  });
});

// 상품 수정
app.post('/mypage/:id', (req, res) => {
  const { id } = req.params;
  const { img, title, cate, price, status, desc, delivery } = req.body;
  const sql = `UPDATE selling SET img=?, title=?, cate=?, price=?, status=?, \`desc\`=?, delivery=? WHERE id=?`;
  connection.query(sql, [img, title, cate, price, status, desc, delivery, id], err => {
    if (err) return res.status(500).json({ error: '상품 수정 실패' });
    res.json({ success: true });
  });
});

// 상품 삭제
app.delete('/selling/:id', (req, res) => {
  const { id } = req.params;
  connection.query('DELETE FROM selling WHERE id=?', [id], (err, result) => {
    if (err) return res.status(500).json({ error: '상품 삭제 실패' });
    res.json({ success: true });
  });
});


//서버실행
app.listen(port, ()=>{
  console.log('Listening...');
});
