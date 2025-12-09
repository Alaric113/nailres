import MemberTabs from '../components/member/MemberTabs';

const UserMemberPage = () => {
  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 h-[calc(100vh-112px)] flex flex-col overflow-hidden">
      <div className="mb-4 flex-shrink-0">
        <h1 className="text-xl font-serif font-bold text-gray-900">會員中心</h1>
      </div>
      
      <div className="flex-1 min-h-0">
         <MemberTabs />
      </div>
    </div>
  );
};

export default UserMemberPage;
