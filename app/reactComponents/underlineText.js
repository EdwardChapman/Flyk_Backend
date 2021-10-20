import Link from 'next/link';

export default function UnderlineText (props) {



    
    return(
    
    
    <div>
    {!props.freshLoad?
        <Link href={props.url}>
        <div>
        <a className="hover hover-3">{props.bold? <strong>{props.title}</strong> : props.title}</a>
        </div>
        </Link>
       : 
        <div>
        <a style={{textDecoration: "none"}}href={props.url} className="hover hover-3">{props.bold? <strong>{props.title}</strong> : props.title}</a>
        </div>
      }


 <style jsx>{`

 ${props.additionalCSS?props.additionalCSS:''}

 a {
     color: ${props.color? props.color : "white"};
     font-weight: ${props.weight? props.weight : "600"};
     font-size: ${props.size? props.size : "22px"};
     font-family: ${props.font}};
     

 }
        
div {
    cursor: pointer;
  }
  
  .hover-3 {
    
    text-align: center;
    margin: 0;
    padding: 0;
    transition: all 0.2s ease-in-out;
    position: relative;
  }
  
  
   .hover-3::after {
    content: "";
    position: absolute;
    bottom: -7px;
    width: 0px;
    height: 3px;
    margin: 0;
    transition: all 0.2s ease-in-out;
    transition-duration: 0.3s;
    opacity: 0;
  
    right: 50%;
    background-color: #3FB9F5;
  }
  
  .hover-3::before {
      content: "";
    position: absolute;
    bottom: -7px;
    width: 0px;
    height: 3px;
    margin: 0;
    transition: all 0.2s ease-in-out;
    transition-duration: 0.3s;
    opacity: 0;
  
    left: calc(50%);
    background-color: #3FA9F5;
  }
  
  
  /* On Hover These are added to the before & after elements */
  div:hover .hover-3::before, div:hover .hover-3::after {
    opacity: 1;
    width: 50%;
  }

        `}</style>
    </div>
    )



}