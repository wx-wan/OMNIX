import HomeLinkButton from "../HomeLinkButton";
import errorpage from "@/assets/images/backgrounds/404.svg"

const Error = () => {
  return (
    <>
      <div className="h-screen flex items-center justify-center ">
        <div className="text-center">
          <img
            src={errorpage}
            alt="error"
            className="mb-20"
            width={500}
            height={500}
          />
          <h1 className="text-foreground text-4xl mb-6">Opps!!!</h1>
          <h6 className="text-xl text-foreground">
            This page you are looking for could not be found.
          </h6>
          <HomeLinkButton />
        </div>
      </div>
    </>
  );
};

export default Error;
