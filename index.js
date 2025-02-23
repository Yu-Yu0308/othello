(()=>{
    //要素
    const $table = document.getElementById('board');
    
    //定数
    const cellsNum = 8; //マス数
    const BLACK = "0";
    const WHITE = "1";
    const DEFAULT = "2";
    const PLAYER_SCORE = "player-info";
    const CP_SCORE = "cp-info";

    //フラグ
    let vacantCellFlag = false; //空いているセルがあるかを判断させるフラグ
    let canPlaceFlag = false;   //置く場所があるかを判断させるフラグ（全体用）
    let canWhiteFlag = true;
    let canBlackFlag = true;
    let turnChangeFlag = false; //置く場所がなく、相手に交代するときのフラグ
    let finishFlag = false;

    //変数
    let turn;
    let playerColor;
    let cpColor;
    let blackNum;
    let whiteNum;

    //盤面のインデックスと状態を保持するための配列
    let boardData;
    let canPlaceCells = [];
    let vacantCells = [];

    function init() {
        $table.InnerHTML = "";
        let dataIndex = 0;
        turn = BLACK;
        boardData = Array.from({length: 8 }, () => Array(0));

        //テーブルを準備
        createBoard(dataIndex);

        //ゲーム開始処理
        startClickEvent();
    };

    //テーブルの準備
    function createBoard(dataIndex){
        let rowIndex = -1;

        for(let i = 0; i < cellsNum; i++){
            const tr = document.createElement("tr");
            for(let j = 0; j < cellsNum; j++){
                const td = document.createElement("td");
                tr.appendChild(td);

                const stone = createStone(dataIndex, DEFAULT);
                td.appendChild(stone);

                //インデックスと状態を配列に格納
                if(dataIndex % cellsNum === 0){
                    rowIndex++;
                }
                addToBoardData(dataIndex, rowIndex, j, i);

                //真ん中の4マスに石を配置する(27,28,35,36)
                setStone(stone, dataIndex);               

                dataIndex++;
            }
            $table.appendChild(tr);
        }
    }

    function createStone(dataIndex, state){
        const stone = document.createElement("div");
        stone.className = "stone";
        //マスにインデックス番号付与 + 状態の初期化
        stone.setAttribute("data-index", dataIndex);
        stone.setAttribute("data-state", state);
        return stone;
    }

    function addToBoardData(dataIndex, rowIndex, col, row){
        boardData[rowIndex].push({
            index : dataIndex, 
            state : DEFAULT,
            x : col,
            y : row
        });
    }

    function setStone(stone, dataIndex){
        const whiteStones = [27,36];
        const blackStones = [28, 35]
        if(whiteStones.includes(dataIndex)){
            //白石を配置
            stone.setAttribute("data-state", WHITE);
            updateBoardData(dataIndex, WHITE);
        }
        if(blackStones.includes(dataIndex)){
            //黒石を配置
            stone.setAttribute("data-state", BLACK);
            updateBoardData(dataIndex, BLACK);
        }
    }

    function updateBoardData(dataIndex, state){
        boardData[Math.floor(dataIndex / cellsNum)][dataIndex % cellsNum].state = state;
    }

    //ゲーム開始処理
    function startClickEvent(){
        //ゲーム開始画面の表示
        //Startボタンを押したときの処理
        const $startListener = document.querySelector('#start-button');
        $startListener.addEventListener("click", function(){
            const $selectedValue = document.querySelector('input[name="color"]:checked');

            //Playerがどちらの色を選択したのかを取得
            playerColor = $selectedValue.getAttribute("data-color");

            //Cpはその逆の色を取得
            if(playerColor == BLACK) cpColor = WHITE;
            else cpColor = BLACK;

            //点数の部分の色の表示の設定
            const $playerPanel = document.querySelector("#player-info");
            const $cpPanel = document.querySelector("#cp-info");

            $playerPanel.setAttribute("data-color", playerColor);
            $cpPanel.setAttribute("data-color", cpColor);

            //色を選択する画面を非表示にする
            const $startView = document.getElementById("start");
            $startView.style.display = "none";

            configBoard();
        }); 
    }
    init();

    function configBoard() {
        if(!finishFlag){
            console.log("turn : " + turn);
            //ターンの表示
            showTurn();
    
            //点数を反映
            changeScore();
    
            //空いているセルを取得
            catchVacantCells();
            //console.log(vacantCells);
    
            //空いているセルが無ければ終了
            if(!vacantCellFlag){
                console.log("finish1 : ");
                    finish();
            }
            console.log("finish3 : " + finishFlag);
    
            //空いているセルの四方八方を確認しておける場所を提示
            configVacantCells();
    
            //空いているセルがあっても、白黒両方ともおけない場合→終了
            if(!canPlaceFlag && turn == BLACK)  canBlackFlag = false;
            if(!canPlaceFlag && turn == WHITE)  canWhiteFlag = false;
            if(!canBlackFlag && !canWhiteFlag){
                    finish();
            }
    
            //「置く場所がないので交代」を表示する
            const $turnChangeError = document.getElementById("change");
            if(!canPlaceFlag && vacantCellFlag){
                turnChangeFlag = true;
                $turnChangeError.style.display = "block";
                if(turn == BLACK){
                    turn = WHITE;
                }else{
                    turn = BLACK;
                }
                vacantCells = [];
                vacantCellFlag = false;
                configBoard();
            }
    
            //「置く場所がないので交代」を非表示にする
            if(!turnChangeFlag){
                $turnChangeError.style.display = "none";
            }
            console.log("flag" + finishFlag);
    
            cpAction();   //条件：turnとcpColorが同じ時だけ処理
            //console.log(canPlaceCells);
        }
    };

    //盤上の石に応じて点数を変更
    function changeScore(){
        //黒石を数える
        blackNum = countStone(BLACK);

        //白石を数える
        whiteNum = countStone(WHITE);

        //player,cpの色を確かめ、Scoreを反映
        updateScore(PLAYER_SCORE, blackNum, whiteNum);
        updateScore(CP_SCORE, blackNum, whiteNum);
    }

    function updateScore(elementId, scoreBlack, scoreWhite){
        const $element = document.getElementById(elementId);
        const color = $element.dataset.color;

        if(color == BLACK){
            $element.querySelector(".score").innerHTML = scoreBlack;
        }else if(color == WHITE){
            $element.querySelector(".score").innerHTML = scoreWhite;
        }
    }

    function countStone(color){
        let num=0;
        boardData.forEach( rowData => {
            rowData.forEach( data => {
                if(data.state === color){
                    num++;
                }
            });
        });
        return num;
    }

    //空いているセルを取得
    function catchVacantCells(){
        boardData.forEach( rowData => {
            rowData.forEach( data => {
                if(data.state === DEFAULT){
                    vacantCellFlag = true;
                    vacantCells.push({
                        index : data.index,
                        x : data.x,
                        y : data.y,
                        left : {index : null, x : null, y : null},
                        right : {index : null, x : null, y : null},
                        above : {index : null, x : null, y : null},
                        under : {index : null, x : null, y : null},
                        aboveRight : {index : null, x : null, y : null},
                        underRight : {index : null, x : null, y : null},
                        aboveLeft : {index : null, x : null, y : null},
                        underLeft : {index : null, x : null, y : null},
                    });
                }
            });
        });
    }

    //ゲーム終了
    function finish(){
        finishFlag = true;
        console.log("finish2 : " + finishFlag);
        const $result = document.getElementsByClassName("result");
        const $end = document.getElementById("end");

        $end.style.display = "block";

        for(let i = 0; i < $result.length; i++){
            $result[i].style.display = "block";
        }
        
        let playerNum;
        let cpNum;
        if(playerColor == BLACK){
            playerNum = blackNum;
            cpNum = whiteNum
        }else{
            playerNum = whiteNum;
            cpNum = blackNum;
        }
        const $playerResult = document.getElementById("player-result");
        const $cpResult = document.getElementById("cp-result");
        if(playerNum > cpNum){
            //playerの勝ち
            $playerResult.innerHTML = "Winner!!";
            $cpResult.innerHTML = "Lose...";
        }else if(playerNum < cpNum){
            //cpの勝ち
            $playerResult.innerHTML = "Lose...";
            $cpResult.innerHTML = "Winner!!";
        }else{
            //引分け
            $playerResult.innerHTML = "Draw";
            $cpResult.innerHTML = "Draw";
        }

    }

    //空いているセルの四方八方を確認しておける場所を提示
    function configVacantCells(){
        if(!finishFlag){
            let notPlaceFlag = false;   //置く場所があるかどうかを判断させる(各マス事用)
            const directions = [
                {dx: -1, dy: 0, key: "left"},
                {dx: 1, dy: 0, key: "right"},
                {dx: 0, dy: -1, key: "above"},
                {dx: 0, dy: 1, key: "under"},
                {dx: 1, dy: -1, key: "aboveRight"},
                {dx: 1, dy: 1, key: "underRight"},
                {dx: -1, dy: -1, key: "aboveLeft"},
                {dx: -1, dy: 1, key: "underLeft"}
            ];
    
            vacantCells.forEach( vacantCell => {
                directions.forEach( direction =>{
                    let result = checkDirection(vacantCell, direction.dx, direction.dy, cellsNum, cellsNum);
                    if(result){
                        vacantCell[direction.key] = result;
                        notPlaceFlag = true;
                        canPlaceFlag = true;
                        canBlackFlag = true;
                        canWhiteFlag = true;
                    }
                });
                if(notPlaceFlag){
                    //おける場所を提示
                    viewPlace(vacantCell.x, vacantCell.y);
                    canPlaceCells.push(vacantCell);
                    notPlaceFlag = false;
                }
            });
            if(!canPlaceFlag){
                console.log("new");
                vacantCells = [];
                canPlaceCells = [];
            }
        }
    }

    function checkDirection(vacantCell, dx, dy, maxX, maxY){
        let iX = vacantCell.x + dx;
        let iY = vacantCell.y + dy;

        if(iX < 0 || iY < 0 || iX >= maxX || iY >= maxY) return null;

        if(boardData[iY][iX].state == DEFAULT || boardData[iY][iX].state == turn) return null;

        while(iX >= 0 && iX < maxX && iY >= 0 && iY < maxY){
            if(boardData[iY][iX].state == DEFAULT) break;
            if(boardData[iY][iX].state == turn){
                return {index : boardData[iX][iY].index, x : iX, y : iY};
            }
            iX += dx;
            iY += dy;
        }
        return null;
    }

    function viewPlace(x, y){
        const $element = document.querySelector(`div.stone[data-index="${boardData[y][x].index}"]`);
        $element.setAttribute("data-state", "3");
    }

    function cpAction(){
        if(cpColor == turn && !finishFlag){
            setTimeout(function() {
                //canPlaceCellsからランダムに一つ選択
                const randomCell = canPlaceCells[Math.floor(Math.random() * canPlaceCells.length)];

                //indexに該当するtdを取得
                const $div = document.querySelector(`div.stone[data-index="${randomCell.index}"]`);
                
                //クリック処理
                if($div){
                    const $cell  = $div.closest("td");
                    if($cell){
                        $cell.addEventListener("click", function(){
                            reverse(this);
                        });
                        $cell.click();
                    }
                }
            }, 1000);

        }
    }

    function showTurn(){
        const $element = document.getElementById("turn");
        if(turn == BLACK)   $element.innerHTML = "黒のターンです";
        if(turn == WHITE)   $element.innerHTML = "白のターンです";
    }

    function clickEvent() {
            const $cells = document.querySelectorAll('td');
            //各セルにクリックイベントを追加
            $cells.forEach(cell => {
                cell.addEventListener("click", function(){
                    if(playerColor == turn){
                        reverse(this);
                    }
                });
            });  
    };
    
    function reverse(cell){

        //x増加量、y増加量、x最大値、y最大値、方向
        const reverseDirections = {
            LEFT: "left",
            RIGHT: "right",
            ABOVE: "above",
            UNDER: "under",
            ABOVE_RIGHT: "aboveRight",
            UNDER_RIGHT: "underRight",
            ABOVE_LEFT: "aboveLeft",
            UNDER_LEFT: "underLeft",
        };        

        //クリックされたセルのインデックスを取得
        const click = catchIndex(cell);

        //「置く場所がないので交代」を非表示にするためのフラグ
        turnChangeFlag = false;

        //石を裏返す
        canPlaceCells.forEach(canPlaceCell => {

            if(click.index == canPlaceCell.index){

                //クリックされた位置に石を設置
                boardData[click.y][click.x].state = turn;
                click.stone.setAttribute("data-state", turn);                   

                //四方八方の石を裏返す
                for(let key in reverseDirections){
                    if(canPlaceCell[reverseDirections[key]].index != null){
                        reverseStone(click.x, click.y, canPlaceCell[reverseDirections[key]].x, canPlaceCell[reverseDirections[key]].y);
                    }
                }

                //配列の中身を殻にして、再度盤上のおける場所を探索
                reset(click);

                //ターン入れ替え
                if(turn == BLACK){
                    turn = WHITE;
                }else{
                    turn = BLACK;
                }
                configBoard();
                               
            }
        });
    };
    
    function catchIndex(cell){
        const stone = cell.querySelector(".stone");
        const clickIndex = stone.getAttribute("data-index");
        const clickX = clickIndex % 8;
        const clickY = Math.floor(clickIndex / 8);
        return {stone : stone, index : clickIndex, x : clickX, y : clickY};
    }

    function reverseStone(startX, startY, endX, endY){
        let x = startX;
        let y = startY;

        while(x !== endX || y !== endY){  
            if(x < endX) x++;
            else if(x > endX) x--;

            if(y < endY) y++;
            else if(y > endY) y--;
            
            boardData[y][x].state = turn;
            const $element = document.querySelector(`div.stone[data-index="${boardData[y][x].index}"]`);
            $element.setAttribute("data-state", turn); 
        }
    }

    function reset(click){
        canPlaceCells.forEach( canPlaceCell => {
            if(!(click.x == canPlaceCell.x && click.y == canPlaceCell.y)){
                const $element = document.querySelector(`div.stone[data-index="${boardData[canPlaceCell.y][canPlaceCell.x].index}"]`);
                $element.setAttribute("data-state", "2");
            }
        });
        canPlaceCells = [];
        vacantCells = [];
        vacantCellFlag = false;
        canPlaceFlag = false;
    }
    clickEvent();

})();


