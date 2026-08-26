export const decideInterviewType = (profile) => {

    const skills = profile.skills.join(" ").toLowerCase();

    if (skills.match(/react|html|css|frontend|ui/))
        return "frontend";

    if (skills.match(/node|express|mongodb|sql|api|backend/))
        return "backend";

    if (skills.match(/python|ml|tensorflow|pandas/))
        return "data";

    if (skills.match(/docker|aws|kubernetes|devops/))
        return "devops";

    return "fullstack";
};