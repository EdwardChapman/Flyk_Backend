import Link from 'next/link'
import Head from 'next/head'
import Header from '../reactComponents/header'

function GlobalFooter() {
    return (
        <footer>
            <h3>Proudly Made In Canada &nbsp;</h3>
            <h2>🇨🇦</h2>
            <style jsx>{`
                footer {
                    height: 20vh;
                    background-color: black;
                    display: flex;
                    align-items: center;
                    justify-content: flex-end;
                    padding: 20px 70px 20px 70px;
                }
                footer h3 {
                    color: white;
                    font-weight: 1;
                    font-size: 18px;
                }
            `}</style>
        </footer>
    )
}
function HomePage() {

    return (
    <div className="PageDiv">
        <div className="ContentDiv">
            <Head>
                <title>Flyk</title>
                <link rel="icon" href="/favicon.png"></link>
                <meta property="og:image" content="/logo.png" />
            </Head>
            <Header></Header>
            <div className="heroText">
                <h1>The video sharing platform</h1>
                <h1 className="secondLine">for</h1>
                <div className="scrollingTextDiv">
                    <h1 className="first">Athletes</h1>
                    <h1>Dancers</h1>
                    <h1>Nerds 🤓</h1>
                    <h1 className="You">You</h1>
                </div>
            </div>
            <Link href="https://www.apple.com/ca/ios/app-store/">
                <img className="downloadButtonBottomCorner" src="/Download_On_App_Store.svg" draggable="false"/>
            </Link>
        </div>
        {/* <GlobalFooter></GlobalFooter> */}

        <style jsx>{`

            .heroText {
                margin-top: 20vh;
                margin-left: 80px;
                // margin-right: 80px;
            }
            .heroText h1 {
                font-size: 50px;
            }
            .heroText .secondLine {
                display: inline-block;
                margin-bottom: 0px;
            }
            .heroText .scrollingTextDiv {
                display: inline-block;
                height: 38px;
                // width: 30vw;
                // background-color: blue;
                overflow: hidden;
                margin-left: 15px;
                // padding-top: 0.8em;
                padding-top: 20px;
                padding-bottom: 12px;
                vertical-align: bottom;
            }
            .scrollingTextDiv .first {
                margin-top: -11px;
                padding-top: 0;
                animation-name: example;
                animation-delay: 0.7s;
                animation-duration: 4.5s;
                animation-fill-mode: forwards;
            }
            .You {
                color: #3FB9F5;
            }
            @keyframes example {
                0%   {margin-top: -11px;}
                25%  {margin-top: -70px;}
                27%  {margin-top: -70px;}
                50%  {margin-top: -133px;}
                52%  {margin-top: -133px;}
                100% {margin-top: -196px;}
              }


            .ContentDiv {
                height: 100vh;
            }
            .downloadButton {
                // This is the one to make it be in the cetner of the screen.
                position: absolute;
                width: 300px;
                bottom: calc(50vh - (0.3 * 300px));
                left: calc(50vw - 150px);
                margin-top: 40vh;
                margin-right: auto;
                margin-left: auto;
            }
            .downloadButtonBottomCorner {
                position: absolute;
                right: 80px;
                bottom: 40px;
                height: 60px;
                cursor: pointer;
            }

            @media (max-width: 550px){
                .downloadButton {
                    width: 250px;
                    bottom: calc(50vh - (0.3 * 250px));
                    left: calc(50vw - 125px);
                }
            }
        
        `}</style>
    
        <style jsx global>{`
            body {
                background-color: rgb(22, 22, 22);
                padding: 0;
                margin: 0;
            }
            * {
                margin: 0;
                padding: 0;
                font-family: "HelveticaNeue-Light", "Helvetica Neue Light", "Helvetica Neue", Helvetica, Arial, "Lucida Grande", sans-serif; 
                font-weight: 300;
                color: white;
                // box-sizing: border-box;
            }
        `}</style>
    </div>
    )
  }
  
  export default HomePage