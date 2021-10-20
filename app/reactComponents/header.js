import Link from 'next/link'
import UnderlineText from '../reactComponents/underlineText'

const additionalUnderlineCSS = `
    @media (max-width:550px) {
        .hover {
            font-size: 12px !important;
        }
    }
`


function Header() {
    return (
    <div className="headerDiv">
        <Link href="/">
            <h1 className="Flyk" >Flyk</h1>
        </Link>
        <div className="rightHeaderGroup">
            <UnderlineText className="firstUnderlinText" additionalCSS={additionalUnderlineCSS} title="Privacy Policy" url="/privacy" font="ff-enzo-web, sans-serif" size="20px"></UnderlineText>
            <UnderlineText additionalCSS={additionalUnderlineCSS} title="Terms &amp; Conditions" url="/terms" font="ff-enzo-web, sans-serif" size="20px"></UnderlineText>
        </div>
        <style jsx>{`
            .rightHeaderGroup {
                display: flex;
                width: 400px;
                justify-content: space-between;
            }
            .headerDiv {
                padding: 50px 70px 0 70px;
                display: flex;
                // align-items: baseline;
                align-items: center;
                justify-content: space-between;
            }
            .Flyk {
                font-size: 85px;
                color: white;
                // font-family: "Myriad Pro", sans-serif;
                font-weight: 1;
                cursor: pointer;
                padding-right: 40px;
            }


            @media (max-width: 550px){
                .rightHeaderGroup {

                }
                .headerDiv {
                    padding: 30px 40px 0 30px;
                }
                .Flyk {
                    font-size: 50px;
                }
            }
        
        `}</style>
    </div>
    )
  }
  
  export default Header